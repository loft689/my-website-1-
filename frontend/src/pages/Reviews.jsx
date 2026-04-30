import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { StarRating } from "../components/StarRating";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Sparkles, Copy, Check, Plus, Search, Filter, Loader2, Trash2, MessageCircle, Download, Upload, Tag, Brain } from "lucide-react";
import { Link } from "react-router-dom";

const toneOptions = ["Professional", "Friendly", "Apologetic"];
const filterOptions = [
  { id: "all", label: "All" },
  { id: "unreplied", label: "Needs reply" },
  { id: "replied", label: "Replied" },
  { id: "positive", label: "Positive (4-5★)" },
  { id: "negative", label: "Negative (1-2★)" },
];

export default function Reviews() {
  const { user, updateCredits } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [tone, setTone] = useState("Professional");
  const [reply, setReply] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importForm, setImportForm] = useState({ business_name: "", category: "", count: 8 });
  const [importing, setImporting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [newReview, setNewReview] = useState({ reviewer_name: "", rating: 5, text: "", source: "Manual" });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/reviews");
      setReviews(data);
      if (data.length && !selectedId) setSelectedId(data[0].id);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const selected = reviews.find((r) => r.id === selectedId);

  useEffect(() => {
    if (selected) setReply(selected.reply || "");
  }, [selectedId]); // eslint-disable-line

  const filtered = reviews.filter((r) => {
    if (query && !`${r.reviewer_name} ${r.text}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (filter === "unreplied") return !r.replied;
    if (filter === "replied") return r.replied;
    if (filter === "positive") return r.rating >= 4;
    if (filter === "negative") return r.rating <= 2;
    return true;
  });

  const generate = async () => {
    if (!selected) return;
    if (user.credits <= 0) {
      toast.error("Out of credits. Upgrade plan to continue.");
      return;
    }
    setGenerating(true);
    try {
      const { data } = await api.post("/ai/generate-reply", {
        review_text: selected.text,
        rating: selected.rating,
        tone,
        reviewer_name: selected.reviewer_name,
        review_id: selected.id,
      });
      setReply(data.reply);
      updateCredits(data.credits_remaining);
      setReviews((rs) => rs.map((r) => (r.id === selected.id ? { ...r, reply: data.reply, replied: true } : r)));
      toast.success("AI reply generated");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Generation failed");
    } finally { setGenerating(false); }
  };

  const copy = () => {
    navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const addReview = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/reviews", newReview);
      setReviews((rs) => [data, ...rs]);
      setSelectedId(data.id);
      setShowAdd(false);
      setNewReview({ reviewer_name: "", rating: 5, text: "", source: "Manual" });
      toast.success("Review added");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    }
  };

  const removeReview = async (id) => {
    try {
      await api.delete(`/reviews/${id}`);
      setReviews((rs) => rs.filter((r) => r.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch { toast.error("Failed to delete"); }
  };

  const doImport = async (e) => {
    e.preventDefault();
    if (!importForm.business_name || !importForm.category) return;
    setImporting(true);
    try {
      const { data } = await api.post("/reviews/import", importForm);
      setReviews((rs) => [...data.reviews, ...rs]);
      setShowImport(false);
      toast.success(`Imported ${data.imported} reviews`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Import failed");
    } finally { setImporting(false); }
  };

  const doExport = async () => {
    try {
      const token = localStorage.getItem("reviewai_token");
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const res = await fetch(`${BACKEND_URL}/api/reviews/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "reviews.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Export failed"); }
  };

  const sentimentOf = (rating) => {
    if (rating >= 4) return { label: "Positive", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" };
    if (rating === 3) return { label: "Neutral", cls: "bg-amber-500/10 text-amber-400 border-amber-500/30" };
    return { label: "Negative", cls: "bg-red-500/10 text-red-400 border-red-500/30" };
  };

  const analyze = async () => {
    if (!selected) return;
    setAnalyzing(true);
    try {
      const { data } = await api.post(`/reviews/${selected.id}/analyze`);
      setReviews((rs) => rs.map((r) => r.id === selected.id ? { ...r, sentiment: data.sentiment, topics: data.topics } : r));
      toast.success("Analyzed");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Analysis failed");
    } finally { setAnalyzing(false); }
  };

  const outOfCredits = user.credits <= 0;

  return (
    <div className="space-y-6" data-testid="reviews-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>Review Inbox</h1>
          <p className="text-sm text-zinc-400 mt-1">{reviews.length} reviews • {reviews.filter(r => !r.replied).length} awaiting reply</p>
        </div>
        <div className="flex gap-2">
          <button onClick={doExport} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-medium" data-testid="export-reviews-btn">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => setShowImport(true)} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-medium" data-testid="import-reviews-btn">
            <Upload size={14} /> Import
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary text-sm" data-testid="add-review-btn">
            <Plus size={16} /> Add review
          </button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            placeholder="Search reviewer or text…"
            className="input-dark pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="review-search-input"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter size={14} className="text-zinc-500 shrink-0" />
          {filterOptions.map((o) => (
            <button
              key={o.id}
              onClick={() => setFilter(o.id)}
              className={`px-3 py-1.5 rounded-full text-xs border whitespace-nowrap transition ${
                filter === o.id
                  ? "bg-gradient-to-r from-[#FF2D75] to-[#FF0055] text-white border-transparent"
                  : "border-white/10 text-zinc-400 hover:text-white"
              }`}
              data-testid={`review-filter-${o.id}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* List */}
        <div className="glass p-3 lg:col-span-2 max-h-[640px] overflow-y-auto">
          {loading && <div className="p-6 text-sm text-zinc-500">Loading…</div>}
          {!loading && filtered.length === 0 && <div className="p-6 text-sm text-zinc-500">No reviews match.</div>}
          <div className="space-y-1">
            {filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className={`w-full text-left p-4 rounded-xl transition border ${
                  selectedId === r.id
                    ? "bg-white/5 border-[#FF2D75]/40"
                    : "bg-transparent border-transparent hover:bg-white/[0.03]"
                }`}
                data-testid={`review-item-${r.id}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 grid place-items-center text-xs font-medium shrink-0">
                      {r.reviewer_name[0]}
                    </div>
                    <div className="font-medium text-sm truncate">{r.reviewer_name}</div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 shrink-0">{r.source}</span>
                </div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <StarRating value={r.rating} size={11} />
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${sentimentOf(r.rating).cls}`}>
                      {sentimentOf(r.rating).label}
                    </span>
                    {r.replied && (
                      <span className="text-[10px] flex items-center gap-1 text-emerald-400">
                        <MessageCircle size={10} /> Replied
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-zinc-400 line-clamp-2">{r.text}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail / AI reply */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="glass p-7 space-y-5" data-testid="review-detail">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FF2D75] to-[#FF0055] grid place-items-center text-sm font-semibold">
                    {selected.reviewer_name[0]}
                  </div>
                  <div>
                    <div className="font-medium">{selected.reviewer_name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarRating value={selected.rating} size={12} />
                      <span className="text-xs text-zinc-500">• {selected.source}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sentimentOf(selected.rating).cls}`}>
                        {sentimentOf(selected.rating).label}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => removeReview(selected.id)} className="text-zinc-500 hover:text-red-400 transition" data-testid="delete-review-btn">
                  <Trash2 size={16} />
                </button>
              </div>

              <p className="text-zinc-300 leading-relaxed text-sm bg-white/[0.02] p-5 rounded-xl border border-white/5" data-testid="review-text">
                {selected.text}
              </p>

              {/* Analyze / topic tags */}
              <div className="flex items-center flex-wrap gap-2">
                {selected.topics?.length ? (
                  selected.topics.map((t, i) => (
                    <span key={i} className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 flex items-center gap-1" data-testid={`topic-tag-${i}`}>
                      <Tag size={10} /> {t}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-zinc-500">No AI topics yet</span>
                )}
                <button
                  onClick={analyze}
                  disabled={analyzing}
                  className="text-[10px] px-2.5 py-1 rounded-full border border-[#FF2D75]/30 text-[#FF2D75] hover:bg-[#FF2D75]/10 flex items-center gap-1 transition"
                  data-testid="analyze-review-btn"
                >
                  {analyzing ? <Loader2 size={10} className="animate-spin" /> : <Brain size={10} />}
                  {selected.topics?.length ? "Re-analyze" : "Analyze"}
                </button>
              </div>

              <div>
                <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Tone</div>
                <div className="flex gap-2 flex-wrap">
                  {toneOptions.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-4 py-2 rounded-full text-xs font-medium border transition ${
                        tone === t
                          ? "bg-gradient-to-r from-[#FF2D75] to-[#FF0055] text-white border-transparent"
                          : "border-white/10 text-zinc-400 hover:text-white"
                      }`}
                      data-testid={`tone-btn-${t.toLowerCase()}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs uppercase tracking-widest text-zinc-500">AI Reply</div>
                  {reply && (
                    <button onClick={copy} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1" data-testid="copy-reply-btn">
                      {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
                    </button>
                  )}
                </div>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Your AI-generated reply will appear here…"
                  className="input-dark min-h-[140px] resize-y"
                  data-testid="reply-textarea"
                />
              </div>

              {outOfCredits ? (
                <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                  <div className="text-sm text-red-400">You're out of credits.</div>
                  <Link to="/pricing" className="btn-primary text-sm" data-testid="upgrade-cta">Upgrade plan to continue</Link>
                </div>
              ) : (
                <button
                  onClick={generate}
                  disabled={generating}
                  className="btn-primary w-full justify-center"
                  data-testid="generate-reply-btn"
                >
                  {generating ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <><Sparkles size={16} /> Generate AI Reply (1 credit)</>}
                </button>
              )}
            </div>
          ) : (
            <div className="glass p-10 text-center text-zinc-500">Select a review to generate a reply.</div>
          )}
        </div>
      </div>

      {/* Add review modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-6" onClick={() => setShowAdd(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={addReview} className="glass p-8 w-full max-w-md space-y-4" data-testid="add-review-modal">
            <h3 className="text-xl font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>Add a review</h3>
            <input required placeholder="Reviewer name" className="input-dark" value={newReview.reviewer_name}
              onChange={(e) => setNewReview((n) => ({ ...n, reviewer_name: e.target.value }))} data-testid="add-review-name" />
            <div>
              <div className="text-xs text-zinc-400 mb-2">Rating</div>
              <div className="flex gap-2">
                {[1,2,3,4,5].map((i) => (
                  <button type="button" key={i} onClick={() => setNewReview((n) => ({ ...n, rating: i }))}
                    className={`w-10 h-10 rounded-xl border ${newReview.rating === i ? "border-[#FF2D75] bg-[#FF2D75]/10 text-white" : "border-white/10 text-zinc-400"}`}>
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <textarea required placeholder="Review text" rows={4} className="input-dark" value={newReview.text}
              onChange={(e) => setNewReview((n) => ({ ...n, text: e.target.value }))} data-testid="add-review-text" />
            <input placeholder="Source (Google, Yelp…)" className="input-dark" value={newReview.source}
              onChange={(e) => setNewReview((n) => ({ ...n, source: e.target.value }))} data-testid="add-review-source" />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2.5 rounded-full text-sm text-zinc-400 hover:text-white">Cancel</button>
              <button type="submit" className="btn-primary text-sm" data-testid="add-review-submit">Add</button>
            </div>
          </form>
        </div>
      )}

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-6" onClick={() => setShowImport(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={doImport} className="glass p-8 w-full max-w-md space-y-4" data-testid="import-reviews-modal">
            <div>
              <h3 className="text-xl font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>Import reviews</h3>
              <p className="text-xs text-zinc-500 mt-1">We'll use AI to pull a realistic snapshot of reviews for your business. Connect Google/Yelp APIs later for live sync.</p>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Business name</label>
              <input required className="input-dark" value={importForm.business_name}
                onChange={(e) => setImportForm((f) => ({ ...f, business_name: e.target.value }))}
                placeholder="e.g. Blue Bottle Coffee" data-testid="import-name-input" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Category</label>
              <input required className="input-dark" value={importForm.category}
                onChange={(e) => setImportForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Coffee shop, Dentist" data-testid="import-category-input" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">How many reviews?</label>
              <input type="number" min={1} max={15} className="input-dark" value={importForm.count}
                onChange={(e) => setImportForm((f) => ({ ...f, count: parseInt(e.target.value || 1) }))}
                data-testid="import-count-input" />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowImport(false)} className="px-5 py-2.5 rounded-full text-sm text-zinc-400 hover:text-white">Cancel</button>
              <button type="submit" disabled={importing} className="btn-primary text-sm" data-testid="import-submit-btn">
                {importing ? <><Loader2 size={14} className="animate-spin" /> Importing…</> : <><Sparkles size={14} /> Import</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
