import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Logo } from "../components/Logo";
import { toast } from "sonner";

export default function Auth({ mode = "login" }) {
  const isSignup = mode === "signup";
  const { login, signup } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isSignup) await signup(name, email, password);
      else await login(email, password);
      nav("/app");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 text-white">
      <div className="absolute top-6 left-6">
        <Link to="/"><Logo /></Link>
      </div>
      <div className="w-full max-w-md glass p-10" data-testid="auth-card">
        <h1 className="text-3xl font-semibold mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-zinc-400 text-sm mb-8">
          {isSignup ? "Start free with 10 credits. No card required." : "Sign in to continue to your dashboard."}
        </p>

        <form onSubmit={submit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Full name</label>
              <input
                required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe" className="input-dark"
                data-testid="auth-name-input"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Email</label>
            <input
              required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com" className="input-dark"
              data-testid="auth-email-input"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Password</label>
            <input
              required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" className="input-dark"
              data-testid="auth-password-input"
            />
          </div>
          <button disabled={busy} type="submit" className="btn-primary w-full justify-center" data-testid="auth-submit-btn">
            {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-sm text-zinc-500 text-center">
          {isSignup ? (
            <>Already have an account? <Link to="/login" className="text-white hover:underline" data-testid="auth-switch-login">Sign in</Link></>
          ) : (
            <>New to ReviewAI? <Link to="/signup" className="text-white hover:underline" data-testid="auth-switch-signup">Create an account</Link></>
          )}
        </div>
      </div>
    </div>
  );
}
