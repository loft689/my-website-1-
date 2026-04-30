from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionRequest,
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGO = "HS256"
JWT_EXP_DAYS = 7

EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
STRIPE_API_KEY = os.environ["STRIPE_API_KEY"]
ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "")

# Fixed server-side plan definitions (NEVER trust client prices)
PLANS = {
    "standard": {"id": "standard", "name": "Standard", "price": 4.00, "credits": 50},
    "pro": {"id": "pro", "name": "Pro", "price": 10.00, "credits": 200},
}

app = FastAPI()
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)


# ---------- Models ----------
class SignupIn(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    plan: str
    credits: int
    credits_reset_at: str
    business_profile: Optional[dict] = None
    business_slug: Optional[str] = None


class TokenOut(BaseModel):
    access_token: str
    user: UserOut


class BusinessProfileIn(BaseModel):
    name: str
    category: str
    location: str


class GenerateReplyIn(BaseModel):
    review_text: str
    rating: int
    tone: Literal["Professional", "Friendly", "Apologetic"]
    reviewer_name: Optional[str] = "the customer"
    review_id: Optional[str] = None


class GenerateReplyOut(BaseModel):
    reply: str
    credits_remaining: int


class ReviewIn(BaseModel):
    reviewer_name: str
    rating: int
    text: str
    source: Optional[str] = "Manual"


class CheckoutIn(BaseModel):
    plan_id: Literal["standard", "pro"]
    origin_url: str


def slugify(s: str) -> str:
    import re as _re
    s = (s or "").lower().strip()
    s = _re.sub(r"[^a-z0-9\s-]", "", s)
    s = _re.sub(r"[\s-]+", "-", s).strip("-")
    return s or "business"


# ---------- Helpers ----------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode(), hashed.encode())


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXP_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    if not creds:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        user_id = payload["sub"]
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "User not found")
    # Check weekly credit reset
    user = await maybe_reset_credits(user)
    return user


async def maybe_reset_credits(user: dict) -> dict:
    reset_at = datetime.fromisoformat(user["credits_reset_at"])
    now = datetime.now(timezone.utc)
    if now >= reset_at and user["plan"] in PLANS:
        new_credits = PLANS[user["plan"]]["credits"]
        new_reset = (now + timedelta(days=7)).isoformat()
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"credits": new_credits, "credits_reset_at": new_reset}},
        )
        user["credits"] = new_credits
        user["credits_reset_at"] = new_reset
    return user


def user_to_out(u: dict) -> UserOut:
    return UserOut(
        id=u["id"],
        email=u["email"],
        name=u["name"],
        plan=u["plan"],
        credits=u["credits"],
        credits_reset_at=u["credits_reset_at"],
        business_profile=u.get("business_profile"),
        business_slug=u.get("business_slug"),
    )


async def seed_reviews_for_user(user_id: str):
    """Seed 6 demo reviews for a new user so dashboard isn't empty."""
    demo = [
        ("Sarah Mitchell", 5, "Absolutely loved the service! The staff was incredibly friendly and the quality exceeded my expectations. Will definitely be back!", "Google"),
        ("James Carter", 2, "Waited over 45 minutes for my order. Food was decent but the experience was frustrating. Hope they improve their service times.", "Yelp"),
        ("Priya Kapoor", 4, "Great atmosphere and tasty menu. Prices are a bit steep but the portions are generous. Recommended for a date night.", "Google"),
        ("Marcus Lee", 1, "Very disappointed. Got the wrong order twice and the manager wasn't helpful at all. Not coming back.", "Trustpilot"),
        ("Elena Rossi", 5, "A hidden gem! The cappuccino is the best in town and the pastries are heavenly. Staff remembered my name on my second visit.", "Google"),
        ("David Okonkwo", 3, "Average experience overall. Nothing remarkable but nothing terrible either. Could use a refresh in decor.", "Facebook"),
    ]
    now = datetime.now(timezone.utc)
    docs = []
    for i, (n, r, t, s) in enumerate(demo):
        docs.append({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "reviewer_name": n,
            "rating": r,
            "text": t,
            "source": s,
            "reply": None,
            "replied": False,
            "created_at": (now - timedelta(days=i)).isoformat(),
        })
    if docs:
        await db.reviews.insert_many(docs)


# ---------- Auth Routes ----------
@api.post("/auth/signup", response_model=TokenOut)
async def signup(data: SignupIn):
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(400, "Email already registered")
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    base_slug = slugify(data.name)
    slug_candidate = f"{base_slug}-{user_id[:6]}"
    user_doc = {
        "id": user_id,
        "email": data.email.lower(),
        "name": data.name,
        "password_hash": hash_password(data.password),
        "plan": "standard",  # free trial starts on standard
        "credits": 10,  # free trial credits
        "credits_reset_at": (now + timedelta(days=7)).isoformat(),
        "business_profile": {
            "name": f"{data.name}'s Business",
            "category": "Local Business",
            "location": "Your City",
        },
        "business_slug": slug_candidate,
        "team_members": [],
        "created_at": now.isoformat(),
    }
    await db.users.insert_one(user_doc)
    await seed_reviews_for_user(user_id)
    token = create_token(user_id)
    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    return TokenOut(access_token=token, user=user_to_out(user_doc))


@api.post("/auth/login", response_model=TokenOut)
async def login(data: LoginIn):
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    # Backfill business_slug if missing (for users created before slug feature)
    if not user.get("business_slug"):
        slug = f"{slugify(user['name'])}-{user['id'][:6]}"
        await db.users.update_one({"id": user["id"]}, {"$set": {"business_slug": slug}})
        user["business_slug"] = slug
    user = await maybe_reset_credits(user)
    token = create_token(user["id"])
    user.pop("password_hash", None)
    user.pop("_id", None)
    return TokenOut(access_token=token, user=user_to_out(user))


@api.get("/auth/me", response_model=UserOut)
async def me(user=Depends(get_current_user)):
    return user_to_out(user)


# ---------- Business Profile ----------
@api.put("/profile", response_model=UserOut)
async def update_profile(data: BusinessProfileIn, user=Depends(get_current_user)):
    await db.users.update_one(
        {"id": user["id"]}, {"$set": {"business_profile": data.model_dump()}}
    )
    user["business_profile"] = data.model_dump()
    return user_to_out(user)


# ---------- Reviews ----------
@api.get("/reviews")
async def list_reviews(user=Depends(get_current_user)):
    reviews = (
        await db.reviews.find({"user_id": user["id"]}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(500)
    )
    return reviews


@api.post("/reviews")
async def create_review(data: ReviewIn, user=Depends(get_current_user)):
    if not (1 <= data.rating <= 5):
        raise HTTPException(400, "Rating must be 1-5")
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "reviewer_name": data.reviewer_name,
        "rating": data.rating,
        "text": data.text,
        "source": data.source or "Manual",
        "reply": None,
        "replied": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reviews.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.delete("/reviews/{review_id}")
async def delete_review(review_id: str, user=Depends(get_current_user)):
    res = await db.reviews.delete_one({"id": review_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(404, "Review not found")
    return {"ok": True}


# ---------- AI Reply ----------
@api.post("/ai/generate-reply", response_model=GenerateReplyOut)
async def generate_reply(data: GenerateReplyIn, user=Depends(get_current_user)):
    if user["credits"] <= 0:
        raise HTTPException(402, "Out of credits. Upgrade plan to continue.")

    biz = user.get("business_profile") or {}
    biz_name = biz.get("name", "our business")
    system = (
        f"You are the owner of '{biz_name}', a {biz.get('category', 'local business')} in "
        f"{biz.get('location', 'your area')}. You write thoughtful, concise replies to customer "
        f"reviews. Keep replies under 80 words. Always sign off naturally (e.g., 'The {biz_name} Team'). "
        f"Match the requested tone exactly: {data.tone}."
    )
    prompt = (
        f"Customer name: {data.reviewer_name}\n"
        f"Rating: {data.rating}/5 stars\n"
        f"Review: {data.review_text}\n\n"
        f"Write a {data.tone.lower()} reply addressing the reviewer by name. "
        f"Do not include any preface like 'Here is the reply:'—only the reply text itself."
    )
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"reply-{user['id']}-{uuid.uuid4()}",
            system_message=system,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        reply_text = await chat.send_message(UserMessage(text=prompt))
        reply_text = reply_text.strip()
    except Exception as e:
        logging.exception("LLM error")
        raise HTTPException(500, f"AI generation failed: {e}")

    # Deduct credit
    new_credits = user["credits"] - 1
    await db.users.update_one({"id": user["id"]}, {"$set": {"credits": new_credits}})

    # Track usage event for history chart
    await db.ai_generations.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "tone": data.tone,
        "rating": data.rating,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # Save to review if review_id provided
    if data.review_id:
        await db.reviews.update_one(
            {"id": data.review_id, "user_id": user["id"]},
            {"$set": {"reply": reply_text, "replied": True}},
        )

    return GenerateReplyOut(reply=reply_text, credits_remaining=new_credits)


# ---------- Analytics ----------
@api.get("/analytics")
async def analytics(user=Depends(get_current_user)):
    reviews = await db.reviews.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
    total = len(reviews)
    avg = round(sum(r["rating"] for r in reviews) / total, 2) if total else 0
    replied = sum(1 for r in reviews if r.get("replied"))
    response_rate = round((replied / total) * 100, 1) if total else 0
    dist = {i: 0 for i in range(1, 6)}
    for r in reviews:
        dist[r["rating"]] = dist.get(r["rating"], 0) + 1
    return {
        "total_reviews": total,
        "average_rating": avg,
        "response_rate": response_rate,
        "replied_count": replied,
        "rating_distribution": dist,
    }


# ---------- Stripe ----------
@api.get("/plans")
async def get_plans():
    return list(PLANS.values())


@api.post("/billing/checkout")
async def create_checkout(
    data: CheckoutIn, request: Request, user=Depends(get_current_user)
):
    plan = PLANS[data.plan_id]
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    origin = data.origin_url.rstrip("/")
    success_url = f"{origin}/billing/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/pricing"

    req = CheckoutSessionRequest(
        amount=float(plan["price"]),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["id"],
            "plan_id": plan["id"],
            "email": user["email"],
        },
    )
    session = await stripe.create_checkout_session(req)

    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "session_id": session.session_id,
        "amount": float(plan["price"]),
        "currency": "usd",
        "plan_id": plan["id"],
        "payment_status": "initiated",
        "status": "pending",
        "credits_granted": False,
        "metadata": {"plan_id": plan["id"], "user_id": user["id"]},
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"url": session.url, "session_id": session.session_id}


@api.get("/billing/status/{session_id}")
async def checkout_status(session_id: str, user=Depends(get_current_user)):
    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not tx:
        raise HTTPException(404, "Transaction not found")

    # Try to fetch live status from Stripe; fall back to stored DB status on error
    status_obj = None
    try:
        stripe = StripeCheckout(
            api_key=STRIPE_API_KEY,
            webhook_url="https://example.com/api/webhook/stripe",
        )
        status_obj = await stripe.get_checkout_status(session_id)
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "status": status_obj.status,
                "payment_status": status_obj.payment_status,
            }},
        )
    except Exception as e:
        logger.warning(f"Stripe status fetch failed for {session_id}: {e}")

    # Re-read latest tx (webhook may have updated it)
    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    payment_status = (status_obj.payment_status if status_obj else tx.get("payment_status", "pending"))
    status = (status_obj.status if status_obj else tx.get("status", "pending"))
    amount_total = int(float(tx.get("amount", 0)) * 100)
    currency = tx.get("currency", "usd")

    # Grant credits only once
    if payment_status == "paid" and not tx.get("credits_granted"):
        plan = PLANS[tx["plan_id"]]
        now = datetime.now(timezone.utc)
        await db.users.update_one(
            {"id": tx["user_id"]},
            {"$set": {
                "plan": plan["id"],
                "credits": plan["credits"],
                "credits_reset_at": (now + timedelta(days=7)).isoformat(),
            }},
        )
        await db.payment_transactions.update_one(
            {"session_id": session_id}, {"$set": {"credits_granted": True}}
        )

    return {
        "status": status,
        "payment_status": payment_status,
        "amount_total": amount_total,
        "currency": currency,
    }


@api.post("/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: Optional[str] = Header(None)):
    body = await request.body()
    host_url = str(request.base_url).rstrip("/")
    stripe = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host_url}/api/webhook/stripe")
    try:
        evt = await stripe.handle_webhook(body, stripe_signature)
    except Exception as e:
        raise HTTPException(400, f"Webhook error: {e}")

    if evt.payment_status == "paid" and evt.session_id:
        tx = await db.payment_transactions.find_one({"session_id": evt.session_id})
        if tx and not tx.get("credits_granted"):
            plan = PLANS.get(tx["plan_id"])
            if plan:
                now = datetime.now(timezone.utc)
                await db.users.update_one(
                    {"id": tx["user_id"]},
                    {"$set": {
                        "plan": plan["id"],
                        "credits": plan["credits"],
                        "credits_reset_at": (now + timedelta(days=7)).isoformat(),
                    }},
                )
                await db.payment_transactions.update_one(
                    {"session_id": evt.session_id},
                    {"$set": {"credits_granted": True, "payment_status": "paid"}},
                )
    return {"received": True}


# ---------- Usage / Export / Import / Admin ----------
@api.get("/analytics/usage")
async def usage_history(days: int = 30, user=Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=days - 1)
    events = await db.ai_generations.find(
        {"user_id": user["id"], "created_at": {"$gte": start.isoformat()}},
        {"_id": 0, "created_at": 1},
    ).to_list(5000)
    buckets = {}
    for i in range(days):
        d = (start + timedelta(days=i)).strftime("%Y-%m-%d")
        buckets[d] = 0
    for e in events:
        d = e["created_at"][:10]
        if d in buckets:
            buckets[d] += 1
    return {"days": [{"date": d, "count": c} for d, c in buckets.items()]}


@api.get("/reviews/export")
async def export_reviews(user=Depends(get_current_user)):
    from fastapi.responses import StreamingResponse
    import csv
    import io

    reviews = (
        await db.reviews.find({"user_id": user["id"]}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(2000)
    )
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["reviewer_name", "rating", "source", "created_at", "replied", "text", "reply"])
    for r in reviews:
        writer.writerow([
            r.get("reviewer_name", ""),
            r.get("rating", ""),
            r.get("source", ""),
            r.get("created_at", ""),
            "yes" if r.get("replied") else "no",
            (r.get("text") or "").replace("\n", " "),
            (r.get("reply") or "").replace("\n", " "),
        ])
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=reviews.csv"},
    )


class ImportIn(BaseModel):
    business_name: str
    category: str
    count: int = 8


@api.post("/reviews/import")
async def import_reviews(data: ImportIn, user=Depends(get_current_user)):
    """Simulated review import: uses AI to generate realistic reviews for the business."""
    if data.count < 1 or data.count > 15:
        raise HTTPException(400, "count must be 1-15")
    system = (
        "You generate realistic online customer reviews as JSON for a given business. "
        "Mix ratings (some 5, some 4, some 3, one 2, sometimes one 1). Keep each review 20-60 words, "
        "sounding authentic with specific details. Use diverse reviewer names and sources "
        "(Google, Yelp, Facebook, Trustpilot)."
    )
    prompt = (
        f"Generate {data.count} realistic reviews for the business '{data.business_name}' "
        f"(category: {data.category}). Return ONLY a JSON array with objects having fields: "
        f"reviewer_name (string), rating (int 1-5), text (string), source (string). "
        f"Do not include any text outside the JSON array."
    )
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"import-{user['id']}-{uuid.uuid4()}",
            system_message=system,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        raw = await chat.send_message(UserMessage(text=prompt))
    except Exception:
        logger.exception("Import AI error")
        raise HTTPException(500, "Failed to import reviews")

    import json as _json
    import re as _re
    # Extract JSON array
    try:
        match = _re.search(r"\[.*\]", raw, _re.DOTALL)
        items = _json.loads(match.group(0)) if match else _json.loads(raw)
    except Exception:
        raise HTTPException(500, "AI returned invalid JSON")

    now = datetime.now(timezone.utc)
    docs = []
    for i, it in enumerate(items):
        rating = int(it.get("rating", 5))
        rating = max(1, min(5, rating))
        docs.append({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "reviewer_name": str(it.get("reviewer_name", "Anonymous")),
            "rating": rating,
            "text": str(it.get("text", "")),
            "source": str(it.get("source", "Imported")),
            "reply": None,
            "replied": False,
            "created_at": (now - timedelta(hours=i)).isoformat(),
        })
    if docs:
        await db.reviews.insert_many(docs)
    for d in docs:
        d.pop("_id", None)
    return {"imported": len(docs), "reviews": docs}


class AdminCreditsIn(BaseModel):
    email: EmailStr
    credits: int


@api.post("/admin/set-credits")
async def admin_set_credits(
    data: AdminCreditsIn,
    x_admin_secret: Optional[str] = Header(None, alias="X-Admin-Secret"),
):
    if not ADMIN_SECRET or x_admin_secret != ADMIN_SECRET:
        raise HTTPException(401, "Invalid admin secret")
    res = await db.users.update_one(
        {"email": data.email.lower()}, {"$set": {"credits": max(0, data.credits)}}
    )
    if res.matched_count == 0:
        raise HTTPException(404, "User not found")
    return {"ok": True, "email": data.email.lower(), "credits": data.credits}


# ---------- Public Wall of Love ----------
@api.get("/public/wall/{slug}")
async def public_wall(slug: str):
    user = await db.users.find_one({"business_slug": slug}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(404, "Business not found")
    reviews = await db.reviews.find(
        {"user_id": user["id"], "rating": {"$gte": 4}, "replied": True},
        {"_id": 0, "user_id": 0},
    ).sort("created_at", -1).to_list(20)
    all_reviews = await db.reviews.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
    avg = round(sum(r["rating"] for r in all_reviews) / len(all_reviews), 2) if all_reviews else 0
    return {
        "business": user.get("business_profile", {}),
        "slug": slug,
        "average_rating": avg,
        "total_reviews": len(all_reviews),
        "reviews": reviews,
    }


# ---------- AI Sentiment & Topic Analyze ----------
@api.post("/reviews/{review_id}/analyze")
async def analyze_review(review_id: str, user=Depends(get_current_user)):
    review = await db.reviews.find_one({"id": review_id, "user_id": user["id"]}, {"_id": 0})
    if not review:
        raise HTTPException(404, "Review not found")
    system = (
        "You analyze customer reviews. Return ONLY valid JSON with fields: "
        '{"sentiment": "positive" | "neutral" | "negative", "topics": [3-5 short tags like "service","wait time","pricing","ambience","food quality","staff friendliness"]}'
    )
    prompt = f"Review (rating {review['rating']}/5): {review['text']}"
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"analyze-{user['id']}-{uuid.uuid4()}",
            system_message=system,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        raw = await chat.send_message(UserMessage(text=prompt))
    except Exception:
        logger.exception("Analyze AI error")
        raise HTTPException(500, "Analysis failed")

    import json as _json
    import re as _re
    try:
        m = _re.search(r"\{.*\}", raw, _re.DOTALL)
        obj = _json.loads(m.group(0)) if m else _json.loads(raw)
    except Exception:
        raise HTTPException(500, "AI returned invalid JSON")

    sentiment = obj.get("sentiment", "neutral")
    topics = obj.get("topics", [])[:5]
    await db.reviews.update_one(
        {"id": review_id}, {"$set": {"sentiment": sentiment, "topics": topics}}
    )
    return {"sentiment": sentiment, "topics": topics}


# ---------- Team ----------
class InviteIn(BaseModel):
    email: EmailStr
    role: Literal["admin", "member"] = "member"


@api.get("/team")
async def list_team(user=Depends(get_current_user)):
    return user.get("team_members", []) or []


@api.post("/team/invite")
async def invite_member(data: InviteIn, request: Request, user=Depends(get_current_user)):
    members = user.get("team_members", []) or []
    if any(m["email"].lower() == data.email.lower() for m in members):
        raise HTTPException(400, "Already invited")
    token = uuid.uuid4().hex
    new_member = {
        "email": data.email.lower(),
        "role": data.role,
        "status": "invited",
        "invite_token": token,
        "invited_at": datetime.now(timezone.utc).isoformat(),
    }
    members.append(new_member)
    await db.users.update_one({"id": user["id"]}, {"$set": {"team_members": members}})
    origin = str(request.headers.get("origin") or request.base_url).rstrip("/")
    invite_link = f"{origin}/signup?invite={token}"
    return {"member": new_member, "invite_link": invite_link}


@api.delete("/team/{email}")
async def remove_member(email: str, user=Depends(get_current_user)):
    members = [m for m in (user.get("team_members", []) or []) if m["email"].lower() != email.lower()]
    await db.users.update_one({"id": user["id"]}, {"$set": {"team_members": members}})
    return {"ok": True}


@api.get("/")
async def root():
    return {"service": "ReviewAI", "status": "ok"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
