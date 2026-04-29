import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "member", stage_name: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const nav = useNavigate();

  const change = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const u = await register(form);
      nav(u.role === "admin" ? "/admin" : "/portal");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16" data-testid="register-page">
      <div className="absolute inset-0 overflow-hidden -z-0">
        <div className="orb" style={{ width: 480, height: 480, background: "#B026FF", top: "5%", right: "-10%" }} />
        <div className="orb" style={{ width: 360, height: 360, background: "#00E5FF", bottom: "5%", left: "-10%", animationDelay: "-4s" }} />
      </div>
      <form onSubmit={submit} className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0D0D14] p-8 md:p-10" data-testid="register-form">
        <div className="label-tag">Join</div>
        <h1 className="font-display text-3xl font-black uppercase tracking-tighter mt-3">Join the Collective</h1>
        <p className="text-white/60 text-sm mt-2">Create your member account.</p>

        <div className="mt-7 space-y-4">
          <Input label="Full name" testid="register-name" value={form.name} onChange={change("name")} required />
          <Input label="Email" testid="register-email" type="email" value={form.email} onChange={change("email")} required />
          <Input label="Password" testid="register-password" type="password" value={form.password} onChange={change("password")} required minLength={6} />
          <label className="block">
            <div className="text-xs uppercase tracking-widest text-white/60 mb-2">Role</div>
            <select value={form.role} onChange={change("role")} data-testid="register-role" className="w-full px-4 py-3 rounded-xl">
              <option value="member">Member</option>
              <option value="dj">DJ</option>
              <option value="mc">MC</option>
            </select>
          </label>
          {(form.role === "dj" || form.role === "mc") && (
            <Input label="Stage name" testid="register-stage" value={form.stage_name} onChange={change("stage_name")} />
          )}
        </div>
        {err && <div className="mt-4 text-sm text-[#FF007F]" data-testid="register-error">{err}</div>}
        <button type="submit" disabled={loading} className="btn-primary w-full mt-7 justify-center disabled:opacity-60" data-testid="register-submit-btn">
          {loading ? "Creating…" : "Create account"}
        </button>
        <div className="mt-5 text-sm text-white/60 text-center">
          Already a member? <Link to="/login" className="text-[#00E5FF] hover:underline">Sign in</Link>
        </div>
      </form>
    </div>
  );
}

function Input({ label, testid, ...rest }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-widest text-white/60 mb-2">{label}</div>
      <input data-testid={testid} className="w-full px-4 py-3 rounded-xl" {...rest} />
    </label>
  );
}
