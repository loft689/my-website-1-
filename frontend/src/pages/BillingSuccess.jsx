import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { CheckCircle, Loader2, XCircle, ArrowRight } from "lucide-react";

export default function BillingSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { refreshUser } = useAuth();
  const nav = useNavigate();
  const [status, setStatus] = useState("pending"); // pending, paid, expired, error
  const attempts = useRef(0);

  useEffect(() => {
    if (!sessionId) { setStatus("error"); return; }
    let cancelled = false;
    const poll = async () => {
      if (attempts.current >= 10) { setStatus("timeout"); return; }
      attempts.current += 1;
      try {
        const { data } = await api.get(`/billing/status/${sessionId}`);
        if (cancelled) return;
        if (data.payment_status === "paid") {
          setStatus("paid");
          await refreshUser();
          return;
        }
        if (data.status === "expired") { setStatus("expired"); return; }
        setTimeout(poll, 2000);
      } catch {
        if (!cancelled) setStatus("error");
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [sessionId, refreshUser]);

  return (
    <div className="min-h-screen grid place-items-center p-6 text-white">
      <div className="glass p-10 max-w-md text-center" data-testid="billing-success-card">
        {status === "pending" && (
          <>
            <Loader2 className="animate-spin text-[#FF2D75] mx-auto mb-4" size={42} />
            <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Confirming your payment…</h2>
            <p className="text-sm text-zinc-400">This usually takes just a few seconds.</p>
          </>
        )}
        {status === "paid" && (
          <>
            <CheckCircle className="text-[#FF2D75] mx-auto mb-4" size={42} />
            <h2 className="text-3xl font-semibold mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>You're in!</h2>
            <p className="text-sm text-zinc-400 mb-6">Your credits have been topped up. Happy replying.</p>
            <button onClick={() => nav("/app")} className="btn-primary" data-testid="success-goto-dashboard">
              Go to dashboard <ArrowRight size={16} />
            </button>
          </>
        )}
        {(status === "expired" || status === "error" || status === "timeout") && (
          <>
            <XCircle className="text-red-400 mx-auto mb-4" size={42} />
            <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Payment not completed</h2>
            <p className="text-sm text-zinc-400 mb-6">Please try again from the pricing page.</p>
            <button onClick={() => nav("/pricing")} className="btn-primary">Back to pricing</button>
          </>
        )}
      </div>
    </div>
  );
}
