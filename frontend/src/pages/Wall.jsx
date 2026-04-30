import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API } from "../lib/api";
import axios from "axios";
import { StarRating } from "../components/StarRating";
import { Logo } from "../components/Logo";
import { Quote, Sparkles } from "lucide-react";

export default function Wall() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    axios.get(`${API}/public/wall/${slug}`).then(({ data }) => setData(data)).catch(() => setErr(true));
  }, [slug]);

  if (err) return <div className="min-h-screen grid place-items-center text-zinc-500">Business not found.</div>;
  if (!data) return <div className="min-h-screen grid place-items-center text-zinc-500">Loading…</div>;

  const biz = data.business || {};

  return (
    <div className="min-h-screen text-white" data-testid="wall-page">
      <header className="max-w-6xl mx-auto px-6 md:px-10 pt-10 pb-6 flex items-center justify-between">
        <Link to="/"><Logo /></Link>
        <Link to="/signup" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5">
          <Sparkles size={12} /> Create your own wall
        </Link>
      </header>

      <section className="max-w-4xl mx-auto px-6 md:px-10 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-white/5 border border-white/10 text-xs text-zinc-300 mb-6">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF2D75] pulse-glow" /> Verified customer love
        </div>
        <h1 className="text-5xl sm:text-6xl font-semibold mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
          {biz.name}
        </h1>
        <div className="text-zinc-400 text-sm mb-8">{biz.category} • {biz.location}</div>

        <div className="flex items-center justify-center gap-8 mb-4">
          <div>
            <div className="text-5xl font-semibold gradient-text" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {data.average_rating}
            </div>
            <div className="mt-2 flex justify-center"><StarRating value={Math.round(data.average_rating)} size={18} /></div>
            <div className="text-xs text-zinc-500 mt-1">Average rating</div>
          </div>
          <div className="w-px h-16 bg-white/10" />
          <div>
            <div className="text-5xl font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {data.total_reviews}
            </div>
            <div className="text-xs text-zinc-500 mt-3">Total reviews</div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 md:px-10 pb-24">
        {data.reviews.length === 0 ? (
          <div className="glass p-12 text-center text-zinc-500">No featured reviews yet.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.reviews.map((r) => (
              <div key={r.id} className="glass p-7 glass-hover transition" data-testid={`wall-review-${r.id}`}>
                <Quote size={20} className="text-[#FF2D75] mb-4" />
                <p className="text-sm text-zinc-200 leading-relaxed mb-6">"{r.text}"</p>
                {r.reply && (
                  <div className="pl-4 border-l-2 border-[#FF2D75]/40 mb-6">
                    <div className="text-[10px] uppercase tracking-widest text-[#FF2D75] mb-1.5">Our reply</div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{r.reply}</p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 grid place-items-center text-xs font-medium">
                      {r.reviewer_name[0]}
                    </div>
                    <div className="text-xs text-zinc-400">{r.reviewer_name}</div>
                  </div>
                  <StarRating value={r.rating} size={12} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-white/5 py-6 text-center">
        <Link to="/" className="text-xs text-zinc-500 hover:text-white inline-flex items-center gap-2">
          Powered by <Logo size={18} />
        </Link>
      </footer>
    </div>
  );
}
