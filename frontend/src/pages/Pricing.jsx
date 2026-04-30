import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Check, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { toast } from "sonner";
import { useState } from "react";

const plans = [
  {
    id: "standard",
    name: "Standard",
    price: 4,
    credits: 50,
    highlighted: false,
    features: ["AI Review Replies", "Basic Analytics", "1 Business Profile", "Email support"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 10,
    credits: 200,
    highlighted: true,
    features: [
      "Everything in Standard",
      "Advanced Analytics",
      "Unlimited Business Profiles",
      "Priority AI response speed",
      "Export reviews (UI)",
    ],
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handleCheckout = async (planId) => {
    if (!user) { nav("/signup"); return; }
    setLoadingPlan(planId);
    try {
      const origin = window.location.origin;
      const { data } = await api.post("/billing/checkout", { plan_id: planId, origin_url: origin });
      window.location.href = data.url;
    } catch (e) {
      toast.error(e.response?.data?.detail || "Checkout failed");
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen text-white">
      <Navbar />
      <section className="pt-36 pb-24">
        <div className="max-w-5xl mx-auto px-6 md:px-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-white/5 border border-white/10 text-xs text-zinc-300 mb-6">
            <Sparkles size={12} className="text-[#FF2D75]" />
            Simple, weekly pricing
          </div>
          <h1 className="text-5xl md:text-6xl font-semibold mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Pricing that <span className="gradient-text">grows with you</span>
          </h1>
          <p className="text-zinc-400 max-w-lg mx-auto mb-16">Start with 10 free credits. Cancel anytime. No hidden fees.</p>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`relative glass p-8 md:p-10 ${p.highlighted ? "border-[#FF2D75]/50 glow-pink" : ""}`}
                data-testid={`plan-card-${p.id}`}
              >
                {p.highlighted && (
                  <div className="absolute -top-3 left-10 px-3 py-1 rounded-full bg-gradient-to-r from-[#FF2D75] to-[#FF0055] text-xs font-medium">Most Popular</div>
                )}
                <h3 className="text-2xl font-semibold mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-5xl font-semibold gradient-text">${p.price}</span>
                  <span className="text-zinc-500">/ week</span>
                </div>
                <div className="text-sm text-zinc-400 mb-6">{p.credits} AI credits / week</div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <Check size={16} className="text-[#FF2D75] mt-0.5 shrink-0" />
                      <span className="text-zinc-300">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleCheckout(p.id)}
                  disabled={loadingPlan === p.id}
                  className={`w-full ${p.highlighted ? "btn-primary" : "rounded-full px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-medium"}`}
                  data-testid={`plan-checkout-${p.id}`}
                >
                  {loadingPlan === p.id ? "Loading…" : user ? "Upgrade" : "Start Free Trial"}
                </button>
              </div>
            ))}
          </div>

          <p className="text-xs text-zinc-500 mt-10">
            Secured by Stripe. {" "}
            {!user && (
              <Link to="/login" className="underline hover:text-white">Already have an account?</Link>
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
