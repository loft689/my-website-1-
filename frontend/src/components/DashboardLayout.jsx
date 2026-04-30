import { NavLink, useNavigate, Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Logo } from "./Logo";
import { LayoutDashboard, MessagesSquare, BarChart3, CreditCard, Building2, LogOut, Zap } from "lucide-react";

const links = [
  { to: "/app", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/app/reviews", icon: MessagesSquare, label: "Reviews" },
  { to: "/app/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/app/profile", icon: Building2, label: "Business" },
  { to: "/app/billing", icon: CreditCard, label: "Billing" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  if (!user) return null;

  const outOfCredits = user.credits <= 0;

  return (
    <div className="min-h-screen flex text-white">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-white/5 bg-[#0A0A0A]/80 backdrop-blur-xl hidden md:flex flex-col">
        <div className="px-6 h-16 flex items-center border-b border-white/5">
          <Link to="/"><Logo /></Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition ${
                  isActive
                    ? "bg-gradient-to-r from-[#FF2D75]/20 to-[#FF0055]/10 text-white border border-[#FF2D75]/30"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`
              }
              data-testid={`sidebar-link-${l.label.toLowerCase()}`}
            >
              <l.icon size={16} />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={() => { logout(); nav("/"); }} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-white/5 w-full" data-testid="sidebar-logout">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-white/5 bg-[#0A0A0A]/60 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-6">
          <div className="md:hidden"><Link to="/"><Logo /></Link></div>
          <div className="hidden md:block text-sm text-zinc-400">
            Welcome back, <span className="text-white">{user.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${
                outOfCredits
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-gradient-to-r from-[#FF2D75]/15 to-[#FF0055]/10 border-[#FF2D75]/30 pulse-glow"
              }`}
              data-testid="credits-pill"
            >
              <Zap size={14} className={outOfCredits ? "text-red-400" : "text-[#FF2D75]"} />
              <span className="text-sm font-medium">
                Credits Remaining: <span data-testid="credits-value">{user.credits}</span>
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF2D75] to-[#FF0055] grid place-items-center text-sm font-semibold" data-testid="user-avatar">
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
