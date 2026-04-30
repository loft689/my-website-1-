import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import Auth from "./pages/Auth";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import Reviews from "./pages/Reviews";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Billing from "./pages/Billing";
import BillingSuccess from "./pages/BillingSuccess";

const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-zinc-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/login" element={<Auth mode="login" />} />
            <Route path="/signup" element={<Auth mode="signup" />} />
            <Route path="/billing/success" element={<Protected><BillingSuccess /></Protected>} />
            <Route path="/app" element={<Protected><DashboardLayout /></Protected>}>
              <Route index element={<DashboardHome />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="profile" element={<Profile />} />
              <Route path="billing" element={<Billing />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster theme="dark" position="top-right" toastOptions={{
            style: { background: "rgba(18,18,18,0.9)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }
          }} />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
