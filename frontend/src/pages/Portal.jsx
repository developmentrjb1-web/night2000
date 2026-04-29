import { useEffect, useState } from "react";
import { Calendar, MapPin, MessageSquare, User, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiErrorDetail } from "@/lib/api";
import { Toaster, toast } from "sonner";

export default function Portal() {
  const { user, setUser } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [profile, setProfile] = useState({ name: "", stage_name: "", bio: "", specialty: "", avatar_url: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && user !== false) {
      setProfile({
        name: user.name || "",
        stage_name: user.stage_name || "",
        bio: user.bio || "",
        specialty: user.specialty || "",
        avatar_url: user.avatar_url || "",
      });
    }
  }, [user]);

  useEffect(() => {
    api.get("/assignments/me").then(({ data }) => setAssignments(data)).catch(() => {});
    api.get("/announcements").then(({ data }) => setAnnouncements(data)).catch(() => {});
  }, []);

  const change = (k) => (e) => setProfile((s) => ({ ...s, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/auth/profile", profile);
      setUser(data);
      toast.success("Profile updated");
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (!user || user === false) return null;

  return (
    <div className="min-h-screen" data-testid="portal-page">
      <Toaster theme="dark" richColors position="top-right" />
      <section className="relative py-16 md:py-20 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0">
          <div className="orb" style={{ width: 380, height: 380, background: "#00E5FF", top: "-20%", left: "-5%" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="label-tag">Member portal</div>
            <h1 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tighter mt-3">
              Welcome, {user.name?.split(" ")[0]}
            </h1>
            <div className="mt-2 text-white/60 text-sm flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-[#00E5FF]">{user.role}</span>
              {user.stage_name && <span>· {user.stage_name}</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-10 grid lg:grid-cols-3 gap-6">
          {/* Stats */}
          <Card title="Assigned Events" testid="portal-assignments-count">
            <div className="font-display text-5xl text-[#00E5FF]">{assignments.length}</div>
            <div className="text-white/50 text-sm mt-1">scheduled performances</div>
          </Card>
          <Card title="Performance Stats" testid="portal-stats">
            <div className="grid grid-cols-2 gap-4">
              <Stat n={assignments.filter((a) => a.event?.status === "past").length} l="Past" color="#FF007F" />
              <Stat n={assignments.filter((a) => a.event?.status === "upcoming").length} l="Upcoming" color="#00E5FF" />
            </div>
          </Card>
          <Card title="Announcements" testid="portal-announcements">
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {announcements.length === 0 && <div className="text-white/50 text-sm">No announcements yet.</div>}
              {announcements.map((a) => (
                <div key={a.id} className="border-l-2 border-[#FF007F] pl-3">
                  <div className="text-sm font-semibold">{a.title}</div>
                  <div className="text-xs text-white/60">{a.body}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-6 md:px-10 grid lg:grid-cols-2 gap-6">
          {/* Schedule */}
          <Card title="My Schedule" icon={Calendar}>
            {assignments.length === 0 ? (
              <div className="text-white/50 text-sm">No event assignments yet. Admin will assign you to upcoming events.</div>
            ) : (
              <ul className="space-y-3">
                {assignments.map((a) => (
                  <li key={a.id} data-testid={`assignment-${a.id}`} className="border border-white/10 rounded-xl p-4 bg-black/40">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <div className="font-display font-bold uppercase">{a.event?.name || "Event"}</div>
                        <div className="text-xs text-white/60 flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3" /> {a.event?.date} · {a.event?.time}
                        </div>
                        {a.event?.venue && (
                          <div className="text-xs text-[#FF007F] flex items-center gap-2 mt-1"><MapPin className="w-3 h-3" /> {a.event.venue}</div>
                        )}
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-widest bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
                        {a.role}
                      </span>
                    </div>
                    {a.notes && <div className="mt-2 text-xs text-white/60 flex items-start gap-2"><MessageSquare className="w-3 h-3 mt-0.5" /> {a.notes}</div>}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Profile */}
          <Card title="My Profile" icon={User}>
            <form onSubmit={save} className="space-y-4" data-testid="portal-profile-form">
              <Field label="Name"><input data-testid="profile-name" value={profile.name} onChange={change("name")} className="w-full px-3 py-2.5 rounded-lg" /></Field>
              <Field label="Stage Name"><input data-testid="profile-stage" value={profile.stage_name} onChange={change("stage_name")} className="w-full px-3 py-2.5 rounded-lg" /></Field>
              <Field label="Specialty"><input data-testid="profile-specialty" value={profile.specialty} onChange={change("specialty")} placeholder="House / Techno / Hosting" className="w-full px-3 py-2.5 rounded-lg" /></Field>
              <Field label="Bio"><textarea data-testid="profile-bio" rows={3} value={profile.bio} onChange={change("bio")} className="w-full px-3 py-2.5 rounded-lg" /></Field>
              <Field label="Avatar URL"><input data-testid="profile-avatar" value={profile.avatar_url} onChange={change("avatar_url")} className="w-full px-3 py-2.5 rounded-lg" /></Field>
              <button type="submit" disabled={saving} className="btn-primary !py-2 !px-5 text-xs" data-testid="profile-save-btn">
                <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save profile"}
              </button>
            </form>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Card({ title, icon: Icon, testid, children }) {
  return (
    <div data-testid={testid} className="rounded-3xl border border-white/10 bg-[#0D0D14] p-6 md:p-7">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="w-4 h-4 text-[#00E5FF]" />}
        <div className="text-xs uppercase tracking-widest text-white/60">{title}</div>
      </div>
      {children}
    </div>
  );
}

function Stat({ n, l, color }) {
  return (
    <div>
      <div className="font-display text-3xl" style={{ color }}>{n}</div>
      <div className="text-[10px] uppercase tracking-widest text-white/50 mt-1">{l}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-widest text-white/60 mb-1.5">{label}</div>
      {children}
    </label>
  );
}
