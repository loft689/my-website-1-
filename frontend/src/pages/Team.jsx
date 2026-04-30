import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { UserPlus, Copy, Check, Trash2, Users } from "lucide-react";

export default function Team() {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ email: "", role: "member" });
  const [inviteLink, setInviteLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = () => api.get("/team").then(({ data }) => setTeam(data));
  useEffect(() => { load(); }, []);

  const invite = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/team/invite", form);
      setInviteLink(data.invite_link);
      setForm({ email: "", role: "member" });
      load();
      toast.success("Invite link created");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    }
  };

  const remove = async (email) => {
    try {
      await api.delete(`/team/${encodeURIComponent(email)}`);
      load();
    } catch { toast.error("Failed"); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const closeModal = () => { setShowInvite(false); setInviteLink(null); };

  return (
    <div className="space-y-8 max-w-3xl" data-testid="team-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>Team</h1>
          <p className="text-sm text-zinc-400 mt-1">Invite teammates to manage reviews together.</p>
        </div>
        <button onClick={() => setShowInvite(true)} className="btn-primary text-sm" data-testid="invite-member-btn">
          <UserPlus size={16} /> Invite member
        </button>
      </div>

      <div className="glass p-7">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500 mb-4">
          <Users size={12} /> {team.length + 1} member{team.length ? "s" : ""}
        </div>
        <ul className="divide-y divide-white/5">
          <li className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF2D75] to-[#FF0055] grid place-items-center text-sm font-semibold">
                {user.name[0]?.toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium">{user.name} <span className="text-xs text-zinc-500">(you)</span></div>
                <div className="text-xs text-zinc-500">{user.email}</div>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#FF2D75]/15 border border-[#FF2D75]/30 text-[#FF2D75]">owner</span>
          </li>
          {team.map((m) => (
            <li key={m.email} className="py-4 flex items-center justify-between" data-testid={`team-row-${m.email}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-800 grid place-items-center text-sm font-semibold text-zinc-400">
                  {m.email[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium">{m.email}</div>
                  <div className="text-xs text-zinc-500 capitalize">{m.status} • {m.role}</div>
                </div>
              </div>
              <button onClick={() => remove(m.email)} className="text-zinc-500 hover:text-red-400" data-testid={`remove-${m.email}`}>
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-6" onClick={closeModal}>
          <div onClick={(e) => e.stopPropagation()} className="glass p-8 w-full max-w-md space-y-4" data-testid="invite-modal">
            {!inviteLink ? (
              <form onSubmit={invite} className="space-y-4">
                <h3 className="text-xl font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>Invite teammate</h3>
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Email</label>
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-dark" placeholder="name@company.com" data-testid="invite-email-input" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Role</label>
                  <select className="input-dark" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} data-testid="invite-role-select">
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-full text-sm text-zinc-400 hover:text-white">Cancel</button>
                  <button type="submit" className="btn-primary text-sm" data-testid="invite-submit-btn">Create invite</button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>Invite created</h3>
                <p className="text-sm text-zinc-400">Share this link with your teammate. They'll join your workspace when they sign up.</p>
                <div className="flex gap-2">
                  <input readOnly value={inviteLink} className="input-dark flex-1 text-xs" data-testid="invite-link-input" />
                  <button onClick={copyLink} className="btn-primary px-4" data-testid="copy-invite-btn">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <button onClick={closeModal} className="btn-primary text-sm">Done</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
