import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Star, MessageSquare, TrendingUp, Award, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [usage, setUsage] = useState([]);

  useEffect(() => {
    api.get("/analytics").then(({ data }) => setStats(data));
    api.get("/analytics/usage?days=30").then(({ data }) => setUsage(data.days));
  }, []);

  if (!stats) return <div className="text-zinc-500">Loading…</div>;
  const max = Math.max(...Object.values(stats.rating_distribution), 1);
  const totalGens = usage.reduce((a, b) => a + b.count, 0);

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

      <div className="glass p-7" data-testid="usage-chart-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity size={18} className="text-[#FF2D75]" /> AI usage (last 30 days)
            </h3>
            <p className="text-xs text-zinc-500 mt-1">{totalGens} AI replies generated</p>
          </div>
        </div>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <AreaChart data={usage} margin={{ top: 5, right: 12, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="pinkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF2D75" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#FF2D75" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} tickFormatter={(d) => d.slice(5)} interval={4} stroke="rgba(255,255,255,0.1)" />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} stroke="rgba(255,255,255,0.1)" allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "rgba(18,18,18,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#FF2D75" }}
              />
              <Area type="monotone" dataKey="count" stroke="#FF2D75" strokeWidth={2} fill="url(#pinkGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
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
