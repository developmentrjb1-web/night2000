import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const links = [
  { to: "/", label: "Home" },
  { to: "/events", label: "Events" },
  { to: "/gallery", label: "Gallery" },
  { to: "/memberships", label: "Memberships" },
  { to: "/book", label: "Book Us" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = async () => {
    await logout();
    nav("/");
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-black/55 backdrop-blur-xl border-b border-white/5" data-testid="site-navbar">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group" data-testid="nav-logo">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00E5FF] via-[#B026FF] to-[#FF007F] pulse-glow" />
            <div className="absolute inset-0.5 rounded-full bg-black flex items-center justify-center">
              <span className="font-display font-black text-sm text-white">N</span>
            </div>
          </div>
          <div className="leading-tight hidden sm:block">
            <div className="font-display font-bold text-sm tracking-widest uppercase">Night Wave</div>
            <div className="text-[10px] tracking-[0.3em] text-[#00E5FF] uppercase">Collective</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`nav-link-${l.label.toLowerCase().replace(/\s/g, "-")}`}
              className={({ isActive }) =>
                `text-sm font-medium tracking-wider uppercase transition-colors ${isActive ? "text-[#00E5FF]" : "text-white/70 hover:text-white"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {user && user !== false ? (
            <>
              {user.role === "admin" && (
                <Link to="/admin" className="btn-secondary !py-2 !px-4 text-xs" data-testid="nav-admin-btn">
                  <Shield className="w-4 h-4" /> Admin
                </Link>
              )}
              <Link to="/portal" className="text-sm text-white/80 hover:text-[#00E5FF] flex items-center gap-2" data-testid="nav-portal-btn">
                <User className="w-4 h-4" /> {user.name?.split(" ")[0] || "Portal"}
              </Link>
              <button onClick={handleLogout} className="text-white/60 hover:text-[#FF007F]" data-testid="nav-logout-btn" aria-label="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-white/70 hover:text-white" data-testid="nav-login-btn">Sign in</Link>
              <Link to="/book" className="btn-primary !py-2 !px-5 text-xs" data-testid="nav-book-btn">Book Us</Link>
            </>
          )}
        </div>

        <button className="lg:hidden text-white" onClick={() => setOpen((s) => !s)} aria-label="Toggle menu" data-testid="nav-mobile-toggle">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/5 bg-black/95 backdrop-blur-xl px-6 py-6 space-y-4" data-testid="nav-mobile-menu">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block text-base font-medium uppercase tracking-wider ${isActive ? "text-[#00E5FF]" : "text-white/80"}`
              }
              data-testid={`nav-mobile-link-${l.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              {l.label}
            </NavLink>
          ))}
          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            {user && user !== false ? (
              <>
                <Link to="/portal" onClick={() => setOpen(false)} className="text-white/80">Portal</Link>
                {user.role === "admin" && <Link to="/admin" onClick={() => setOpen(false)} className="text-white/80">Admin</Link>}
                <button onClick={() => { setOpen(false); handleLogout(); }} className="text-left text-[#FF007F]">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="text-white/80">Sign in</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="text-[#00E5FF]">Join the Collective</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
