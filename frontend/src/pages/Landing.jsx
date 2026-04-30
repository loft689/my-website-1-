import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Logo } from "../components/Logo";
import { ArrowRight, Sparkles, BarChart3, MessageSquare, Zap, ShieldCheck, Star } from "lucide-react";

const HERO_BG = "https://static.prod-images.emergentagent.com/jobs/e38da796-4e34-44aa-ac07-3e3afe6444bc/images/9f2c1b8b9fa6eade1ee6c10f563ad3e72be7591cc362a1a2d58018ef755fcebe.png";

const features = [
  { icon: Sparkles, title: "AI Review Replies", desc: "Generate on-brand, human-sounding replies in any tone in under 2 seconds." },
  { icon: MessageSquare, title: "Unified Review Inbox", desc: "All your reviews from Google, Yelp, and Facebook in one elegant dashboard." },
  { icon: BarChart3, title: "Reputation Analytics", desc: "Track average rating, response rate, and sentiment trends at a glance." },
  { icon: Zap, title: "Priority AI Speed", desc: "Pro users get lightning-fast AI responses when reviews come in hot." },
  { icon: ShieldCheck, title: "Tone Guardrails", desc: "Professional, Friendly, or Apologetic—tone-locked so you never sound off." },
  { icon: Star, title: "5-Star Playbook", desc: "Craft replies proven to convert 2-star complaints into return customers." },
];

export default function Landing() {
  return (
    <div className="min-h-screen text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-36 pb-24 overflow-hidden" data-testid="hero-section">
        <div
          className="absolute inset-0 opacity-50"
          style={{ backgroundImage: `url(${HERO_BG})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/60 via-[#0A0A0A]/80 to-[#0A0A0A]" />
        <div className="relative max-w-6xl mx-auto px-6 md:px-10">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-white/5 border border-white/10 text-xs text-zinc-300 mb-8 fade-up">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF2D75] pulse-glow" />
            Now with Claude Sonnet 4.5 — the fastest AI for reputation
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight fade-up" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Get More <span className="gradient-text">5-Star Reviews</span><br /> with AI.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-zinc-400 fade-up">
            Reply instantly. Rank higher. Grow faster. ReviewAI drafts thoughtful responses to every customer review so you earn back time and trust.
          </p>
          <div className="mt-10 flex flex-wrap gap-4 fade-up">
            <Link to="/signup" className="btn-primary" data-testid="hero-cta-signup">
              Start Free Trial <ArrowRight size={18} />
            </Link>
            <Link to="/pricing" className="inline-flex items-center gap-2 rounded-full px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-medium" data-testid="hero-cta-pricing">
              See pricing
            </Link>
          </div>

          {/* Stats strip */}
          <div className="mt-20 grid grid-cols-3 gap-4 max-w-3xl">
            {[
              { k: "87%", v: "Avg response-rate lift" },
              { k: "4.8★", v: "Customer rating goal" },
              { k: "2 sec", v: "Typical reply time" },
            ].map((s) => (
              <div key={s.k} className="glass p-5 text-center">
                <div className="text-2xl font-semibold gradient-text">{s.k}</div>
                <div className="text-xs text-zinc-500 mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24" data-testid="features-section">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="max-w-xl mb-16">
            <div className="text-xs uppercase tracking-widest text-[#FF2D75] mb-3">Features</div>
            <h2 className="text-4xl md:text-5xl font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Built to earn you <span className="gradient-text">trust at scale</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="glass p-7 glass-hover transition-all duration-300" data-testid={`feature-card-${i}`}>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF2D75] to-[#FF0055] grid place-items-center mb-5 glow-pink">
                  <f.icon size={20} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* How to Use — nested inside Features */}
          <div id="how-to-use" className="mt-24" data-testid="how-to-use-section">
            <div className="max-w-xl mb-12">
              <div className="text-xs uppercase tracking-widest text-[#FF2D75] mb-3">How to use</div>
              <h3 className="text-3xl md:text-4xl font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>
                From signup to first reply <span className="gradient-text">in under 60 seconds</span>
              </h3>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {[
                { n: "1", t: "Create your account", d: "Sign up with email — you'll start with 10 free credits and 6 sample reviews to play with. No card required." },
                { n: "2", t: "Connect Google Reviews", d: "Open Business → paste your Google Place ID and (optional) API key to pull live reviews. No keys? Click Import to AI-simulate a realistic snapshot." },
                { n: "3", t: "Pick a tone & generate", d: "Open any review, choose Professional / Friendly / Apologetic, and hit Generate AI Reply. Claude Sonnet 4.5 drafts a reply in ~2 seconds. Costs 1 credit." },
                { n: "4", t: "Analyze sentiment & topics", d: "Click Analyze on any review to extract sentiment + topic tags. Use them to spot recurring complaints or wins across customers." },
                { n: "5", t: "Share your Wall of Love", d: "Every account gets a public /wall/your-business URL showcasing top 4-5★ reviews. Drop the link on your site, menu, or QR codes for free social proof." },
                { n: "6", t: "Invite your team", d: "Open Team in the sidebar, invite teammates by email, and respond together. Pro plan unlocks unlimited business profiles." },
              ].map((s) => (
                <div key={s.n} className="glass p-6 flex gap-5" data-testid={`how-step-${s.n}`}>
                  <div className="text-3xl font-semibold gradient-text shrink-0 w-10" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {s.n}
                  </div>
                  <div>
                    <div className="font-semibold mb-1">{s.t}</div>
                    <p className="text-sm text-zinc-400 leading-relaxed">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <Link to="/signup" className="btn-primary inline-flex" data-testid="how-to-cta">
                Try it free <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <h2 className="text-4xl md:text-5xl font-semibold mb-16" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Three steps. <span className="gradient-text">One reputation.</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              ["01", "Connect your reviews", "Import feedback from Google, Yelp, Facebook, or paste manually."],
              ["02", "Pick a tone", "Professional, Friendly, or Apologetic — we match your voice."],
              ["03", "Hit send", "Approve and publish AI-crafted replies in seconds, not hours."],
            ].map(([n, t, d], i) => (
              <div key={i} className="glass p-8">
                <div className="text-5xl font-semibold gradient-text mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>{n}</div>
                <h3 className="text-xl font-semibold mb-2">{t}</h3>
                <p className="text-sm text-zinc-400">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 md:px-10">
          <div className="glass p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#FF2D75]/20 blur-3xl" />
            <h2 className="text-4xl md:text-5xl font-semibold mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Ready to <span className="gradient-text">reply smarter?</span>
            </h2>
            <p className="text-zinc-400 mb-8 max-w-lg mx-auto">Start with 10 free credits. No card required.</p>
            <Link to="/signup" className="btn-primary inline-flex" data-testid="cta-signup-bottom">
              Start Free Trial <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-6xl mx-auto px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <Logo />
          <div className="flex gap-6">
            <Link to="/pricing" className="hover:text-white">Pricing</Link>
            <Link to="/login" className="hover:text-white">Sign in</Link>
            <a href="#features" className="hover:text-white">Features</a>
          </div>
          <div>© 2026 ReviewAI</div>
        </div>
      </footer>
    </div>
  );
}
