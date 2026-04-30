import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CreditCard, Zap, ArrowRight, CheckCircle } from "lucide-react";

export default function Billing() {
  const { user } = useAuth();
  const planLabel = user.plan === "pro" ? "Pro" : user.plan === "standard" ? "Standard" : "Free Trial";
  const resetDate = new Date(user.credits_reset_at).toLocaleDateString();

  return (
    <div className="space-y-8 max-w-3xl" data-testid="billing-page">
      <div>
        <h1 className="text-3xl font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>Billing</h1>
        <p className="text-sm text-zinc-400 mt-1">Manage your plan and credits.</p>
      </div>

      <div className="glass p-8 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-[#FF2D75]/20 blur-3xl" />
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF2D75] mb-3">
          <CreditCard size={14} /> Current plan
        </div>
        <div className="flex items-end gap-3 mb-6">
          <div className="text-5xl font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>{planLabel}</div>
          {user.plan === "pro" && <div className="px-2 py-0.5 rounded-full text-xs bg-gradient-to-r from-[#FF2D75] to-[#FF0055]">Most Popular</div>}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="text-xs text-zinc-500 mb-1">Credits remaining</div>
            <div className="text-2xl font-semibold flex items-center gap-2">
              <Zap size={18} className="text-[#FF2D75]" />{user.credits}
            </div>
          </div>
          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="text-xs text-zinc-500 mb-1">Next credit refresh</div>
            <div className="text-2xl font-semibold">{resetDate}</div>
          </div>
        </div>

        <Link to="/pricing" className="btn-primary mt-8" data-testid="billing-change-plan">
          {user.plan === "pro" ? "Manage plan" : "Upgrade plan"} <ArrowRight size={16} />
        </Link>
      </div>

      <div className="glass p-7">
        <h3 className="text-lg font-semibold mb-4">What you get</h3>
        <ul className="space-y-3 text-sm text-zinc-300">
          {["Unlimited reviews in your inbox", "AI-generated replies in 3 tones", "Reputation analytics dashboard", "Weekly credit refresh", "Cancel anytime"].map((f) => (
            <li key={f} className="flex items-start gap-3">
              <CheckCircle size={16} className="text-[#FF2D75] mt-0.5 shrink-0" /> {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
