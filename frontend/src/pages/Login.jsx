import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const next = loc.state?.from || "/portal";

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const u = await login(email, password);
      nav(u.role === "admin" ? "/admin" : next);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16" data-testid="login-page">
      <div className="absolute inset-0 overflow-hidden -z-0">
        <div className="orb" style={{ width: 480, height: 480, background: "#00E5FF", top: "5%", left: "-10%" }} />
        <div className="orb" style={{ width: 360, height: 360, background: "#FF007F", bottom: "5%", right: "-10%", animationDelay: "-4s" }} />
      </div>
      <form onSubmit={submit} className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0D0D14] p-8 md:p-10" data-testid="login-form">
        <div className="label-tag">Member portal</div>
        <h1 className="font-display text-3xl font-black uppercase tracking-tighter mt-3">Sign in</h1>
        <p className="text-white/60 text-sm mt-2">Welcome back to the wave.</p>

        <div className="mt-7 space-y-4">
          <label className="block">
            <div className="text-xs uppercase tracking-widest text-white/60 mb-2">Email</div>
            <input data-testid="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl" />
          </label>
          <label className="block">
            <div className="text-xs uppercase tracking-widest text-white/60 mb-2">Password</div>
            <input data-testid="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl" />
          </label>
        </div>
        {err && <div className="mt-4 text-sm text-[#FF007F]" data-testid="login-error">{err}</div>}
        <button type="submit" disabled={loading} className="btn-primary w-full mt-7 justify-center disabled:opacity-60" data-testid="login-submit-btn">
          {loading ? "Signing in…" : "Sign In"}
        </button>
        <div className="mt-5 text-sm text-white/60 text-center">
          New here? <Link to="/register" className="text-[#00E5FF] hover:underline">Join the Collective</Link>
        </div>
      </form>
    </div>
  );
}
