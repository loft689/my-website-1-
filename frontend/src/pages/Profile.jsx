import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Building2 } from "lucide-react";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState(user.business_profile || { name: "", category: "", location: "" });
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.put("/profile", form);
      setUser(data);
      toast.success("Profile saved");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Save failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-2xl space-y-6" data-testid="profile-page">
      <div>
        <h1 className="text-3xl font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>Business Profile</h1>
        <p className="text-sm text-zinc-400 mt-1">Used by AI to tailor replies to your brand voice.</p>
      </div>

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
        <button disabled={busy} className="btn-primary" data-testid="profile-save-btn">{busy ? "Saving…" : "Save changes"}</button>
      </form>
    </div>
  );
}
