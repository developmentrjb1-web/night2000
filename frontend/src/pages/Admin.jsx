import { useEffect, useState } from "react";
import { Trash2, Plus, Send, Calendar } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { Toaster, toast } from "sonner";

export default function Admin() {
  const [tab, setTab] = useState("overview");
  return (
    <div className="min-h-screen" data-testid="admin-page">
      <Toaster theme="dark" richColors position="top-right" />
      <section className="relative py-12 md:py-16 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="label-tag">Admin</div>
          <h1 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tighter mt-3">Control Room</h1>
          <div className="mt-7 flex flex-wrap gap-2 border-b border-white/5" data-testid="admin-tabs">
            {[
              ["overview", "Overview"],
              ["bookings", "Bookings"],
              ["events", "Events"],
              ["members", "Members"],
              ["assignments", "Assignments"],
              ["announcements", "Announcements"],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                data-testid={`admin-tab-${k}`}
                className={`px-4 py-2 text-xs uppercase tracking-widest transition-all border-b-2 -mb-px ${
                  tab === k ? "border-[#00E5FF] text-[#00E5FF]" : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          {tab === "overview" && <Overview />}
          {tab === "bookings" && <Bookings />}
          {tab === "events" && <Events />}
          {tab === "members" && <Members />}
          {tab === "assignments" && <Assignments />}
          {tab === "announcements" && <Announcements />}
        </div>
      </section>
    </div>
  );
}

function Overview() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get("/admin/stats").then(({ data }) => setS(data)).catch(() => {}); }, []);
  if (!s) return <div className="text-white/50">Loading…</div>;
  const cards = [
    ["Members", s.users, "#00E5FF"],
    ["DJs / MCs", s.djs, "#FF007F"],
    ["Events", s.events, "#B026FF"],
    ["Total Bookings", s.bookings, "#00E5FF"],
    ["New Bookings", s.new_bookings, "#FF007F"],
    ["Pending Applications", s.pending_applications, "#B026FF"],
  ];
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="admin-overview">
      {cards.map(([l, n, c]) => (
        <div key={l} className="rounded-2xl border border-white/10 bg-[#0D0D14] p-6">
          <div className="text-xs uppercase tracking-widest text-white/50">{l}</div>
          <div className="font-display text-4xl mt-2" style={{ color: c }}>{n}</div>
        </div>
      ))}
    </div>
  );
}

function Bookings() {
  const [list, setList] = useState([]);
  const load = () => { api.get("/bookings").then(({ data }) => setList(data)).catch(() => {}); };
  useEffect(load, []);
  const setStatus = async (id, status) => {
    try {
      await api.patch(`/bookings/${id}`, { status });
      toast.success("Updated");
      load();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0D0D14] p-2" data-testid="admin-bookings">
      {list.length === 0 ? <div className="p-6 text-white/50">No bookings yet.</div> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-white/50 uppercase text-[10px] tracking-widest">
              <tr><th className="p-3">Date</th><th className="p-3">Name</th><th className="p-3">Type</th><th className="p-3">Event Date</th><th className="p-3">Venue</th><th className="p-3">Contact</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id} className="border-t border-white/5" data-testid={`booking-row-${b.id}`}>
                  <td className="p-3 text-white/60 text-xs">{new Date(b.created_at).toLocaleDateString()}</td>
                  <td className="p-3 font-semibold">{b.full_name}</td>
                  <td className="p-3 text-[#00E5FF]">{b.event_type}</td>
                  <td className="p-3 text-white/70">{b.event_date}</td>
                  <td className="p-3 text-white/70">{b.venue}</td>
                  <td className="p-3 text-white/60">{b.contact_number}</td>
                  <td className="p-3">
                    <select value={b.status} onChange={(e) => setStatus(b.id, e.target.value)} className="px-2 py-1 rounded text-xs">
                      <option value="new">new</option>
                      <option value="contacted">contacted</option>
                      <option value="confirmed">confirmed</option>
                      <option value="declined">declined</option>
                      <option value="completed">completed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Events() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: "", date: "", time: "", venue: "", description: "", lineup: "", image_url: "", status: "upcoming" });
  const load = () => { api.get("/events").then(({ data }) => setList(data)).catch(() => {}); };
  useEffect(load, []);
  const change = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));
  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post("/events", { ...form, lineup: form.lineup.split(",").map((s) => s.trim()).filter(Boolean) });
      toast.success("Event created");
      setForm({ name: "", date: "", time: "", venue: "", description: "", lineup: "", image_url: "", status: "upcoming" });
      load();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete event?")) return;
    await api.delete(`/events/${id}`);
    load();
  };
  return (
    <div className="grid lg:grid-cols-2 gap-6" data-testid="admin-events">
      <form onSubmit={create} className="rounded-3xl border border-white/10 bg-[#0D0D14] p-6 space-y-3" data-testid="admin-event-form">
        <div className="text-xs uppercase tracking-widest text-white/60">Create Event</div>
        <input required value={form.name} onChange={change("name")} placeholder="Name" className="w-full px-3 py-2.5 rounded-lg" />
        <div className="grid grid-cols-2 gap-3">
          <input required type="date" value={form.date} onChange={change("date")} className="px-3 py-2.5 rounded-lg" />
          <input required value={form.time} onChange={change("time")} placeholder="9:00 PM" className="px-3 py-2.5 rounded-lg" />
        </div>
        <input required value={form.venue} onChange={change("venue")} placeholder="Venue" className="w-full px-3 py-2.5 rounded-lg" />
        <textarea rows={2} value={form.description} onChange={change("description")} placeholder="Description" className="w-full px-3 py-2.5 rounded-lg" />
        <input value={form.lineup} onChange={change("lineup")} placeholder="Lineup (comma separated)" className="w-full px-3 py-2.5 rounded-lg" />
        <input value={form.image_url} onChange={change("image_url")} placeholder="Image URL" className="w-full px-3 py-2.5 rounded-lg" />
        <select value={form.status} onChange={change("status")} className="w-full px-3 py-2.5 rounded-lg">
          <option value="upcoming">upcoming</option><option value="past">past</option>
        </select>
        <button type="submit" className="btn-primary !py-2 !px-5 text-xs"><Plus className="w-4 h-4" /> Create</button>
      </form>
      <div className="rounded-3xl border border-white/10 bg-[#0D0D14] p-6 space-y-3 max-h-[700px] overflow-y-auto">
        <div className="text-xs uppercase tracking-widest text-white/60">All Events</div>
        {list.map((e) => (
          <div key={e.id} className="border border-white/10 rounded-xl p-4 flex items-start justify-between gap-3">
            <div>
              <div className="font-display font-bold uppercase text-sm">{e.name}</div>
              <div className="text-xs text-white/60 flex items-center gap-2 mt-1"><Calendar className="w-3 h-3" /> {e.date} · {e.time}</div>
              <div className="text-xs text-[#FF007F] mt-1">{e.venue}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 mt-1">{e.status}</div>
            </div>
            <button onClick={() => remove(e.id)} className="text-white/40 hover:text-[#FF007F]" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {list.length === 0 && <div className="text-white/50 text-sm">No events yet.</div>}
      </div>
    </div>
  );
}

function Members() {
  const [list, setList] = useState([]);
  useEffect(() => { api.get("/admin/users").then(({ data }) => setList(data)).catch(() => {}); }, []);
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0D0D14] p-2" data-testid="admin-members">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-white/50 uppercase text-[10px] tracking-widest">
            <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Stage</th><th className="p-3">Joined</th></tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="border-t border-white/5">
                <td className="p-3 font-semibold">{u.name}</td>
                <td className="p-3 text-white/70">{u.email}</td>
                <td className="p-3"><span className="text-[10px] uppercase tracking-widest text-[#00E5FF]">{u.role}</span></td>
                <td className="p-3 text-white/60">{u.stage_name || "—"}</td>
                <td className="p-3 text-white/40 text-xs">{u.created_at?.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Assignments() {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ user_id: "", event_id: "", role: "DJ", notes: "" });
  const load = async () => {
    const [u, ev, a] = await Promise.all([
      api.get("/admin/users"), api.get("/events"), api.get("/assignments")
    ]);
    setUsers(u.data); setEvents(ev.data); setList(a.data);
  };
  useEffect(() => { load().catch(() => {}); }, []);
  const create = async (e) => {
    e.preventDefault();
    if (!form.user_id || !form.event_id) return toast.error("Select user and event");
    try {
      await api.post("/assignments", form);
      toast.success("Assigned");
      setForm({ user_id: "", event_id: "", role: "DJ", notes: "" });
      load();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };
  const remove = async (id) => { await api.delete(`/assignments/${id}`); load(); };
  return (
    <div className="grid lg:grid-cols-2 gap-6" data-testid="admin-assignments">
      <form onSubmit={create} className="rounded-3xl border border-white/10 bg-[#0D0D14] p-6 space-y-3">
        <div className="text-xs uppercase tracking-widest text-white/60">Assign event to member</div>
        <select value={form.user_id} onChange={(e) => setForm((s) => ({ ...s, user_id: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg">
          <option value="">Select member…</option>
          {users.filter((u) => u.role !== "admin").map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
        </select>
        <select value={form.event_id} onChange={(e) => setForm((s) => ({ ...s, event_id: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg">
          <option value="">Select event…</option>
          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name} — {ev.date}</option>)}
        </select>
        <select value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg">
          <option>DJ</option><option>MC</option><option>HOST</option>
        </select>
        <textarea rows={2} value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} placeholder="Notes" className="w-full px-3 py-2.5 rounded-lg" />
        <button type="submit" className="btn-primary !py-2 !px-5 text-xs"><Send className="w-4 h-4" /> Assign</button>
      </form>
      <div className="rounded-3xl border border-white/10 bg-[#0D0D14] p-6 space-y-3 max-h-[700px] overflow-y-auto">
        <div className="text-xs uppercase tracking-widest text-white/60">All Assignments</div>
        {list.map((a) => (
          <div key={a.id} className="border border-white/10 rounded-xl p-4 flex items-start justify-between gap-3">
            <div>
              <div className="font-display font-bold uppercase text-sm">{a.user?.name} → {a.event?.name}</div>
              <div className="text-xs text-white/60 mt-1">{a.event?.date} · {a.event?.venue}</div>
              <div className="text-[10px] uppercase tracking-widest text-[#00E5FF] mt-1">Role: {a.role}</div>
              {a.notes && <div className="text-xs text-white/60 mt-1">{a.notes}</div>}
            </div>
            <button onClick={() => remove(a.id)} className="text-white/40 hover:text-[#FF007F]"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {list.length === 0 && <div className="text-white/50 text-sm">No assignments yet.</div>}
      </div>
    </div>
  );
}

function Announcements() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ title: "", body: "", audience: "all" });
  const load = () => api.get("/announcements").then(({ data }) => setList(data));
  useEffect(() => { load().catch(() => {}); }, []);
  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post("/announcements", form);
      toast.success("Posted");
      setForm({ title: "", body: "", audience: "all" });
      load();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };
  const remove = async (id) => { await api.delete(`/announcements/${id}`); load(); };
  return (
    <div className="grid lg:grid-cols-2 gap-6" data-testid="admin-announcements">
      <form onSubmit={create} className="rounded-3xl border border-white/10 bg-[#0D0D14] p-6 space-y-3">
        <div className="text-xs uppercase tracking-widest text-white/60">Post Announcement</div>
        <input required value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} placeholder="Title" className="w-full px-3 py-2.5 rounded-lg" />
        <textarea required rows={4} value={form.body} onChange={(e) => setForm((s) => ({ ...s, body: e.target.value }))} placeholder="Body" className="w-full px-3 py-2.5 rounded-lg" />
        <select value={form.audience} onChange={(e) => setForm((s) => ({ ...s, audience: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg">
          <option value="all">All</option><option value="djs">DJs</option><option value="mcs">MCs</option><option value="elite">Elite</option>
        </select>
        <button type="submit" className="btn-primary !py-2 !px-5 text-xs"><Send className="w-4 h-4" /> Post</button>
      </form>
      <div className="rounded-3xl border border-white/10 bg-[#0D0D14] p-6 space-y-3 max-h-[700px] overflow-y-auto">
        <div className="text-xs uppercase tracking-widest text-white/60">Posted</div>
        {list.map((a) => (
          <div key={a.id} className="border border-white/10 rounded-xl p-4 flex items-start justify-between gap-3">
            <div>
              <div className="font-display font-bold uppercase text-sm">{a.title}</div>
              <div className="text-xs text-white/60 mt-1">{a.body}</div>
              <div className="text-[10px] uppercase tracking-widest text-[#00E5FF] mt-1">For: {a.audience}</div>
            </div>
            <button onClick={() => remove(a.id)} className="text-white/40 hover:text-[#FF007F]"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {list.length === 0 && <div className="text-white/50 text-sm">No announcements.</div>}
      </div>
    </div>
  );
}
