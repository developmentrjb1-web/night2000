import { Link } from "react-router-dom";
import { Check, Star, Crown } from "lucide-react";
import { useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast, Toaster } from "sonner";

const TIERS = [
  {
    key: "basic",
    icon: Star,
    color: "#00E5FF",
    name: "Basic Member",
    price: "Free",
    desc: "For nightlife lovers and supporters.",
    perks: [
      "Priority RSVP to events",
      "Member-only newsletter",
      "Discount codes from partners",
      "Community Discord access",
    ],
  },
  {
    key: "vip",
    icon: Crown,
    color: "#FF007F",
    featured: true,
    name: "VIP Member",
    price: "₱499 / mo",
    desc: "For the regulars who never miss a night.",
    perks: [
      "Everything in Basic",
      "Guest list at partner clubs",
      "Free entry on members' nights",
      "Early access to ticket drops",
      "Exclusive merch drops",
    ],
  },
  {
    key: "elite",
    icon: Crown,
    color: "#B026FF",
    name: "Elite Performer",
    price: "Application",
    desc: "For DJs / MCs joining the official roster.",
    perks: [
      "Booking representation",
      "Featured roster placement",
      "Performance stats dashboard",
      "Event assignments via portal",
      "Internal collective network",
    ],
  },
];

export default function Memberships() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(null);

  const apply = async (tier) => {
    if (!user) {
      toast.error("Sign in or register to apply.");
      return;
    }
    setSubmitting(tier);
    try {
      await api.post("/memberships/apply", { tier, motivation: "Applied via memberships page" });
      toast.success("Application submitted! We'll review and reach out.");
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Failed to apply");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="min-h-screen" data-testid="memberships-page">
      <Toaster theme="dark" richColors position="top-right" />

      <section className="relative py-20 md:py-28 border-b border-white/5">
        <div className="absolute inset-0 overflow-hidden">
          <div className="orb" style={{ width: 380, height: 380, background: "#B026FF", top: "10%", left: "30%" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 md:px-10 text-center md:text-left">
          <div className="label-tag">Memberships</div>
          <h1 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter mt-4">
            Join the <span className="text-[#FF007F]">Collective.</span>
          </h1>
          <p className="text-white/60 mt-4 max-w-xl">
            Three tiers. One community. Pick your level and ride the wave with us.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-10 grid md:grid-cols-3 gap-6">
          {TIERS.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.key}
                data-testid={`membership-tier-${t.key}`}
                className={`relative rounded-3xl border bg-[#0D0D14] p-8 md:p-10 transition-all duration-500 hover:-translate-y-1 ${
                  t.featured ? "border-[#FF007F]/50 shadow-[0_0_40px_rgba(255,0,127,0.15)] md:scale-[1.03]" : "border-white/10 hover:border-white/30"
                }`}
              >
                {t.featured && (
                  <div className="absolute -top-3 left-8 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest bg-[#FF007F] text-white font-semibold">
                    Most Popular
                  </div>
                )}
                <Icon className="w-8 h-8" style={{ color: t.color }} />
                <h3 className="font-display text-2xl font-bold uppercase tracking-tight mt-5">{t.name}</h3>
                <div className="font-display text-3xl mt-2" style={{ color: t.color }}>{t.price}</div>
                <p className="text-white/60 mt-3 text-sm">{t.desc}</p>
                <ul className="mt-6 space-y-3">
                  {t.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-white/80">
                      <Check className="w-4 h-4 mt-0.5" style={{ color: t.color }} /> {p}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => apply(t.key)}
                  disabled={submitting === t.key}
                  data-testid={`apply-${t.key}-btn`}
                  className={`mt-8 w-full ${t.featured ? "btn-primary" : "btn-secondary"} disabled:opacity-60`}
                >
                  {submitting === t.key ? "Applying…" : t.key === "elite" ? "Apply Now" : "Join the Collective"}
                </button>
                {!user && (
                  <div className="mt-3 text-xs text-white/40 text-center">
                    <Link to="/login" className="hover:text-white">Sign in</Link> or{" "}
                    <Link to="/register" className="hover:text-white">register</Link> to apply
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
