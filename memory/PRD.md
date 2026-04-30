# ReviewAI — PRD

## Original Problem Statement
Build a modern SaaS web app "ReviewAI" that helps local businesses improve their online reputation by generating AI-powered replies to customer reviews. Include credit system (1 reply = 1 credit), pricing page (Standard $4/wk 50 credits, Pro $10/wk 200 credits), dashboard with sidebar, landing page, auth, business profile, analytics. Dark premium design (#0A0A0A bg, neon pink/red #FF2D75→#FF0055 gradient, glassmorphism).

## User Choices
- AI: Claude Sonnet 4.5 via Emergent LLM key
- Auth: Real JWT + MongoDB
- Stripe: Real integration (test keys)
- Credit reset: Weekly reset logic

## Architecture
- **Backend** FastAPI + MongoDB (motor). Routes prefixed /api.
- **Auth** JWT (bcrypt hashed passwords) via Authorization: Bearer header.
- **AI** emergentintegrations LlmChat with model anthropic/claude-sonnet-4-5-20250929.
- **Stripe** emergentintegrations StripeCheckout, fixed server-side plan catalog, payment_transactions collection, /api/webhook/stripe + polling on /billing/success.
- **Frontend** React 19 + React Router v7 + Tailwind + shadcn UI + sonner toasts.

## Implemented (Feb 2026 — v1)
- Landing page (hero, features, how-it-works, CTA, footer)
- Pricing page (Standard + Pro with Stripe checkout)
- Auth pages (login + signup) with real JWT
- Dashboard layout with sidebar + topbar credits pill
- Dashboard home (stats + recent reviews + quick CTA)
- Reviews inbox: list + search + filter + detail panel, tone selector, Claude-powered reply generation with credit decrement, add/delete review, copy reply
- Analytics page (stats + rating distribution bars)
- Business profile editor
- Billing page (current plan, credits, next refresh)
- Billing success flow with polling
- 6 seed reviews per signup

## Backlog
- P0: End-to-end testing via testing_agent_v3
- P1: Email notifications for new reviews, multi-business profiles on Pro plan, review import from Google/Yelp APIs
- P2: Export reviews CSV, team members, usage history chart, AI sentiment tagging

## Next Tasks
1. Run testing_agent_v3 for backend + frontend E2E
2. Fix any critical bugs
3. Ship v1

