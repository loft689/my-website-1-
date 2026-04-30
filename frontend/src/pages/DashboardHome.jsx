import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { StarRating } from "../components/StarRating";
import { MessagesSquare, Star, TrendingUp, Clock, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api.get("/analytics").then(({ data }) => setStats(data));
    api.get("/reviews").then(({ data }) => setRecent(data.slice(0, 4)));
  }, []);

  return (
    <div className="space-y-8" data-testid="dashboard-home">
      <div>
        <h1 className="text-4xl font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Good to see you, <span className="gradient-text">{user.name.split(" ")[0]}</span>
        </h1>
        <p className="text-zinc-400 mt-2 text-sm">Here's what's happening with your reputation today.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-5">
        <StatCard icon={Star} label="Average rating" value={stats?.average_rating ?? "—"} suffix=" / 5" />
        <StatCard icon={MessagesSquare} label="Total reviews" value={stats?.total_reviews ?? "—"} />
        <StatCard icon={TrendingUp} label="Response rate" value={stats?.response_rate ?? 0} suffix="%" />
        <StatCard icon={Clock} label="Plan" value={user.plan === "pro" ? "Pro" : user.plan === "standard" ? "Standard" : "Free"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="glass p-7 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold">Latest reviews</h3>
            <Link to="/app/reviews" className="text-sm text-zinc-400 hover:text-white flex items-center gap-1" data-testid="goto-all-reviews">
              See all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-4">
            {recent.length === 0 && <div className="text-sm text-zinc-500">No reviews yet.</div>}
            {recent.map((r) => (
              <div key={r.id} className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 grid place-items-center text-sm font-medium shrink-0">
                  {r.reviewer_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm">{r.reviewer_name}</div>
                    <StarRating value={r.rating} size={12} />
                  </div>
                  <div className="text-xs text-zinc-400 mt-1 line-clamp-2">{r.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-7 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-[#FF2D75]/20 blur-3xl" />
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF2D75] to-[#FF0055] grid place-items-center mb-5 glow-pink">
            <Sparkles size={18} />
          </div>
          <h3 className="text-lg font-semibold mb-2">Reply faster</h3>
          <p className="text-sm text-zinc-400 mb-6">Jump to the review inbox and craft AI replies in a click.</p>
          <Link to="/app/reviews" className="btn-primary text-sm" data-testid="quick-reply-cta">
            Open inbox <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ icon: Icon, label, value, suffix = "" }) => (
  <div className="glass p-6 glass-hover transition">
    <div className="flex items-center justify-between mb-4">
      <div className="text-xs uppercase tracking-wider text-zinc-500">{label}</div>
      <Icon size={16} className="text-[#FF2D75]" />
    </div>
    <div className="text-3xl font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {value}{suffix}
    </div>
  </div>
);
