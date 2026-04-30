import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Building2, ExternalLink, CheckCircle2 } from "lucide-react";
import { WallQR } from "../components/WallQR";

export default function Profile() {
  const { user, setUser } = useAuth();
  const bp = user.business_profile || {};
  const [form, setForm] = useState({
    name: bp.name || "",
    category: bp.category || "",
    location: bp.location || "",
    google_place_id: bp.google_place_id || "",
    google_api_key: bp.google_api_key ? "••••••••" : "",
  });
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        category: form.category,
        location: form.location,
        google_place_id: form.google_place_id || null,
        // Only send key if user actually changed it (not the masked placeholder)
        google_api_key: form.google_api_key && !form.google_api_key.startsWith("••") ? form.google_api_key : null,
      };
      const { data } = await api.put("/profile", payload);
      setUser(data);
      toast.success("Profile saved");
      // Re-mask key after save
      if (data.business_profile?.google_api_key) {
        setForm((f) => ({ ...f, google_api_key: "••••••••" }));
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "Save failed");
    } finally { setBusy(false); }
  };

  const googleConnected = !!bp.google_place_id;

  return (
    <div className="max-w-2xl space-y-6" data-testid="profile-page">
      <div>
        <h1 className="text-3xl font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>Business Profile</h1>
        <p className="text-sm text-zinc-400 mt-1">Used by AI to tailor replies to your brand voice.</p>
      </div>

      {user.business_slug && (
        <WallQR slug={user.business_slug} businessName={bp.name || user.name} />
      )}

      <form onSubmit={save} className="glass p-8 space-y-5">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF2D75] to-[#FF0055] grid place-items-center glow-pink">
          <Building2 size={20} />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1.5 block">Business name</label>
          <input required className="input-dark" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="profile-name-input" />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1.5 block">Category</label>
          <input required placeholder="e.g. Coffee Shop, Dentist, Salon" className="input-dark" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} data-testid="profile-category-input" />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1.5 block">Location</label>
          <input required placeholder="City, Country" className="input-dark" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} data-testid="profile-location-input" />
        </div>

        {/* Google Reviews connect */}
        <div className="pt-6 mt-6 border-t border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Connect Google Reviews
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Pull live reviews from Google Business Profile.</p>
            </div>
            {googleConnected && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} /> Connected
              </span>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Google Place ID</label>
              <input
                placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                className="input-dark"
                value={form.google_place_id}
                onChange={(e) => setForm({ ...form, google_place_id: e.target.value })}
                data-testid="google-place-id-input"
              />
              <a
                href="https://developers.google.com/maps/documentation/places/web-service/place-id"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#FF2D75] hover:underline inline-flex items-center gap-1 mt-1.5"
              >
                Find your Place ID <ExternalLink size={10} />
              </a>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Google Places API Key (optional)</label>
              <input
                type="password"
                placeholder="AIzaSy••••••••"
                className="input-dark"
                value={form.google_api_key}
                onChange={(e) => setForm({ ...form, google_api_key: e.target.value })}
                data-testid="google-api-key-input"
              />
              <p className="text-[11px] text-zinc-500 mt-1.5">
                Stored encrypted. Leave empty to use AI-simulated import. {" "}
                <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-[#FF2D75] hover:underline inline-flex items-center gap-1">
                  Get a key <ExternalLink size={10} />
                </a>
              </p>
            </div>
          </div>
        </div>

        <button disabled={busy} className="btn-primary" data-testid="profile-save-btn">{busy ? "Saving…" : "Save changes"}</button>
      </form>
    </div>
  );
}
