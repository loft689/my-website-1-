import { Link, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <header className="fixed top-0 w-full z-50 bg-[#0A0A0A]/70 backdrop-blur-2xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <Link to="/" data-testid="nav-home-link"><Logo /></Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-300">
          <Link to="/#features" className="hover:text-white transition" data-testid="nav-features">Features</Link>
          <Link to="/pricing" className="hover:text-white transition" data-testid="nav-pricing">Pricing</Link>
          <a href="/#how" className="hover:text-white transition" data-testid="nav-how">How it works</a>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button variant="ghost" className="text-white hover:bg-white/5 rounded-full" onClick={() => nav("/app")} data-testid="nav-dashboard-btn">Dashboard</Button>
              <Button onClick={() => { logout(); nav("/"); }} className="btn-primary" data-testid="nav-logout-btn">Logout</Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-zinc-300 hover:text-white px-4" data-testid="nav-login-link">Sign in</Link>
              <Link to="/signup" className="btn-primary text-sm" data-testid="nav-signup-link">Start Free Trial</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
