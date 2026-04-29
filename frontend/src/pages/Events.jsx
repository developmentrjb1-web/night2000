import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Mic, Disc3 } from "lucide-react";
import { api } from "@/lib/api";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [tab, setTab] = useState("upcoming");

  useEffect(() => {
    api.get("/events").then(({ data }) => setEvents(data)).catch(() => {});
  }, []);

  const filtered = events.filter((e) => e.status === tab);

  return (
    <div className="min-h-screen" data-testid="events-page">
      <section className="relative py-20 md:py-28 border-b border-white/5">
        <div className="absolute inset-0 overflow-hidden">
          <div className="orb" style={{ width: 420, height: 420, background: "#00E5FF", top: "-10%", left: "-10%" }} />
          <div className="orb" style={{ width: 380, height: 380, background: "#B026FF", bottom: "-15%", right: "-10%", animationDelay: "-5s" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 md:px-10">
          <div className="label-tag">Calendar</div>
          <h1 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter mt-4">
            Where the <span className="text-[#FF007F]">wave</span> hits next.
          </h1>
          <div className="mt-8 inline-flex rounded-full border border-white/15 p-1" data-testid="events-tabs">
            {[
              { k: "upcoming", l: "Upcoming" },
              { k: "past", l: "Past" },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                data-testid={`events-tab-${t.k}`}
                className={`px-5 py-2 rounded-full text-xs uppercase tracking-widest transition-all ${
                  tab === t.k ? "bg-[#00E5FF] text-black" : "text-white/70 hover:text-white"
                }`}
              >
                {t.l}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-10 grid lg:grid-cols-3 gap-6">
          {filtered.map((ev) => (
            <article key={ev.id} data-testid={`event-card-${ev.id}`} className="group rounded-3xl overflow-hidden border border-white/10 bg-[#0D0D14] hover:border-[#FF007F]/40 transition-all duration-500 hover:-translate-y-1">
              <div className="relative aspect-[16/10] overflow-hidden">
                <img src={ev.image_url} alt={ev.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest border border-white/20 bg-black/60 backdrop-blur">
                  {ev.status}
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 text-xs text-white/50">
                  <Calendar className="w-3 h-3" /> {new Date(ev.date).toDateString()} · {ev.time}
                </div>
                <h3 className="font-display text-2xl font-bold uppercase tracking-tight mt-2">{ev.name}</h3>
                <div className="flex items-center gap-2 text-sm text-[#FF007F] mt-2"><MapPin className="w-3 h-3" /> {ev.venue}</div>
                <p className="text-white/60 text-sm mt-3 leading-relaxed">{ev.description}</p>
                {ev.lineup?.length > 0 && (
                  <div className="mt-5">
                    <div className="text-[10px] uppercase tracking-widest text-[#00E5FF] mb-2">Lineup</div>
                    <div className="flex flex-wrap gap-2">
                      {ev.lineup.map((name) => (
                        <span key={name} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs flex items-center gap-1">
                          {name.startsWith("MC") ? <Mic className="w-3 h-3" /> : <Disc3 className="w-3 h-3" />} {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {ev.status === "upcoming" && (
                  <Link to="/book" className="btn-primary mt-6 !py-2 !px-5 text-xs" data-testid={`event-reserve-btn-${ev.id}`}>
                    Reserve / Book Now
                  </Link>
                )}
              </div>
            </article>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-white/50 text-center py-16">No {tab} events.</div>
          )}
        </div>
      </section>
    </div>
  );
}
