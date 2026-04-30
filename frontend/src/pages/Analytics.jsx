import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Star, MessageSquare, TrendingUp, Award } from "lucide-react";

export default function Analytics() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get("/analytics").then(({ data }) => setStats(data)); }, []);
  if (!stats) return <div className="text-zinc-500">Loading…</div>;

  const max = Math.max(...Object.values(stats.rating_distribution), 1);

  return (
    <div className="space-y-8" data-testid="analytics-page">
      <div>
        <h1 className="text-3xl font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>Analytics</h1>
        <p className="text-sm text-zinc-400 mt-1">Reputation performance at a glance.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-5">
        <Stat label="Average rating" value={stats.average_rating} icon={Star} suffix=" / 5" />
        <Stat label="Total reviews" value={stats.total_reviews} icon={MessageSquare} />
        <Stat label="Response rate" value={stats.response_rate} icon={TrendingUp} suffix="%" />
        <Stat label="Replied" value={stats.replied_count} icon={Award} />
      </div>

      <div className="glass p-7">
        <h3 className="text-lg font-semibold mb-6">Rating distribution</h3>
        <div className="space-y-3">
          {[5,4,3,2,1].map((s) => {
            const count = stats.rating_distribution[s] || 0;
            const pct = (count / max) * 100;
            return (
              <div key={s} className="flex items-center gap-4" data-testid={`rating-bar-${s}`}>
                <div className="w-12 text-sm text-zinc-400 flex items-center gap-1">
                  {s} <Star size={12} className="fill-[#FF2D75] text-[#FF2D75]" />
                </div>
                <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#FF2D75] to-[#FF0055] rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="w-10 text-right text-sm text-zinc-400">{count}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const Stat = ({ label, value, icon: Icon, suffix = "" }) => (
  <div className="glass p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="text-xs uppercase tracking-wider text-zinc-500">{label}</div>
      <Icon size={16} className="text-[#FF2D75]" />
    </div>
    <div className="text-3xl font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>{value}{suffix}</div>
  </div>
);
