import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Disc3, Mic2, PartyPopper, Sparkles, MapPin, Calendar, Instagram, Facebook } from "lucide-react";
import Soundwave from "@/components/Soundwave";
import { api } from "@/lib/api";

const SERVICES = [
  { icon: Disc3, title: "DJ Sets", desc: "Open-format and curated sets — house, techno, hip-hop, OPM remixes.", color: "#00E5FF" },
  { icon: Mic2, title: "MC Hosting", desc: "Hype hosts to keep your crowd locked in from start to last call.", color: "#FF007F" },
  { icon: PartyPopper, title: "Private Events", desc: "Birthdays, weddings, brand activations — full production teams.", color: "#B026FF" },
  { icon: Sparkles, title: "Club Performances", desc: "Resident sets and guest takeovers in the country's hottest rooms.", color: "#00E5FF" },
];

export default function Home() {
  const [djs, setDjs] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api.get("/djs").then(({ data }) => setDjs(data.filter((d) => d.featured).slice(0, 4))).catch(() => {});
    api.get("/events?status=upcoming").then(({ data }) => setEvents(data.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div data-testid="home-page">
      {/* HERO */}
      <section className="relative min-h-[92vh] overflow-hidden flex items-center" data-testid="hero-section">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1764258559789-40cf1eb2025f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920"
            alt=""
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black" />
          <div className="orb" style={{ width: 480, height: 480, background: "#FF007F", top: "-10%", left: "-10%" }} />
          <div className="orb" style={{ width: 520, height: 520, background: "#00E5FF", top: "30%", right: "-15%", animationDelay: "-4s" }} />
          <div className="orb" style={{ width: 360, height: 360, background: "#B026FF", bottom: "-10%", left: "30%", animationDelay: "-7s" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 md:px-10 w-full pt-20 pb-16">
          <div className="rise max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-12 bg-[#00E5FF]" />
              <span className="label-tag" data-testid="hero-label">DJ &amp; Event Collective</span>
            </div>
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[7.5rem] font-black uppercase leading-[0.9] tracking-tighter" data-testid="hero-title">
              Feel the<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] via-[#B026FF] to-[#FF007F]">Beat.</span>{" "}
              Ride the<br />
              <span className="italic font-light">Wave.</span> 🌊
            </h1>
            <p className="mt-8 text-lg md:text-xl text-white/70 max-w-xl leading-relaxed">
              A community of DJs, MCs, and event makers building the loudest nights from the booth to the dancefloor.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/book" className="btn-primary" data-testid="hero-cta-book">
                Book Us <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/register" className="btn-secondary" data-testid="hero-cta-join">
                Join the Collective
              </Link>
              <div className="ml-2"><Soundwave /></div>
            </div>
          </div>
        </div>

        {/* Marquee */}
        <div className="absolute bottom-0 left-0 right-0 border-y border-white/10 bg-black/60 backdrop-blur overflow-hidden">
          <div className="flex marquee whitespace-nowrap py-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-12 pr-12 text-white/50 font-display uppercase tracking-[0.3em] text-sm">
                <span>● Live DJ Sets</span><span className="text-[#00E5FF]">● MC Hosting</span>
                <span>● Private Events</span><span className="text-[#FF007F]">● Club Performances</span>
                <span>● Festival Bookings</span><span className="text-[#B026FF]">● Artist Roster</span>
                <span>● Feel the Beat. Ride the Wave.</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="relative py-24 md:py-32" data-testid="about-section">
        <div className="max-w-7xl mx-auto px-6 md:px-10 grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-5">
            <div className="label-tag">About us</div>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mt-4">
              We don't play sets.<br />
              <span className="text-[#FF007F]">We build nights.</span>
            </h2>
          </div>
          <div className="md:col-span-7 text-white/70 text-lg leading-relaxed">
            <p>
              Night Wave Collective is a curated roster of DJs, MCs, and producers shaping nightlife — from
              underground basements to luxury rooftops. Our artists are booked for clubs, festivals, brand
              activations and private events across the region. Plug into the wave.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-6">
              <div><div className="font-display text-3xl text-[#00E5FF]">120+</div><div className="text-xs uppercase tracking-widest text-white/40 mt-1">Events</div></div>
              <div><div className="font-display text-3xl text-[#FF007F]">25</div><div className="text-xs uppercase tracking-widest text-white/40 mt-1">Artists</div></div>
              <div><div className="font-display text-3xl text-[#B026FF]">8</div><div className="text-xs uppercase tracking-widest text-white/40 mt-1">Cities</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="relative py-24 md:py-32 border-y border-white/5 bg-[#070710]" data-testid="services-section">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="flex items-end justify-between flex-wrap gap-6 mb-14">
            <div>
              <div className="label-tag">Services</div>
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mt-3">What we deliver</h2>
            </div>
            <Link to="/book" className="text-[#00E5FF] text-sm uppercase tracking-widest hover:underline">Get a quote →</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} data-testid={`service-card-${i}`} className="group relative rounded-2xl bg-[#0D0D14] border border-white/10 p-7 overflow-hidden transition-all duration-500 hover:border-[#00E5FF]/40 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(0,229,255,0.12)]">
                  <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-20 blur-3xl transition-opacity group-hover:opacity-40" style={{ background: s.color }} />
                  <Icon className="w-8 h-8" style={{ color: s.color }} />
                  <h3 className="mt-6 font-display text-xl font-bold uppercase tracking-tight">{s.title}</h3>
                  <p className="mt-3 text-white/60 text-sm leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED DJs */}
      <section className="py-24 md:py-32" data-testid="featured-djs-section">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
            <div>
              <div className="label-tag">Roster</div>
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mt-3">Featured DJs &amp; MCs</h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {djs.map((dj) => (
              <div key={dj.id} data-testid={`featured-dj-${dj.id}`} className="group relative rounded-2xl overflow-hidden border border-white/10 bg-[#0D0D14] hover:border-[#FF007F]/40 transition-all duration-500 hover:-translate-y-1">
                <div className="aspect-[3/4] overflow-hidden">
                  <img src={dj.avatar_url} alt={dj.stage_name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="text-[10px] tracking-[0.3em] uppercase text-[#00E5FF]">{dj.role}</div>
                  <div className="font-display font-black text-2xl uppercase mt-1">{dj.stage_name}</div>
                  <div className="text-white/60 text-xs mt-1">{dj.specialty}</div>
                </div>
              </div>
            ))}
            {djs.length === 0 && <div className="col-span-full text-white/50">Loading roster…</div>}
          </div>
        </div>
      </section>

      {/* UPCOMING EVENTS */}
      <section className="py-24 md:py-32 bg-[#070710] border-y border-white/5" data-testid="upcoming-events-section">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
            <div>
              <div className="label-tag">Calendar</div>
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mt-3">Upcoming Events</h2>
            </div>
            <Link to="/events" className="text-[#00E5FF] text-sm uppercase tracking-widest hover:underline">All events →</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {events.map((ev) => (
              <Link key={ev.id} to="/events" data-testid={`upcoming-event-${ev.id}`} className="group rounded-2xl overflow-hidden border border-white/10 bg-[#0D0D14] hover:border-[#00E5FF]/40 transition-all duration-500 hover:-translate-y-1">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={ev.image_url} alt={ev.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 text-xs text-white/50">
                    <Calendar className="w-3 h-3" /> {new Date(ev.date).toDateString()} · {ev.time}
                  </div>
                  <div className="font-display text-xl font-bold uppercase tracking-tight mt-2">{ev.name}</div>
                  <div className="flex items-center gap-2 text-sm text-[#FF007F] mt-2"><MapPin className="w-3 h-3" /> {ev.venue}</div>
                </div>
              </Link>
            ))}
            {events.length === 0 && <div className="col-span-full text-white/50">No upcoming events yet.</div>}
          </div>
        </div>
      </section>

      {/* SOCIAL CTA */}
      <section className="relative py-24 md:py-32 overflow-hidden" data-testid="social-cta-section">
        <div className="absolute inset-0">
          <img src="https://images.pexels.com/photos/1494666/pexels-photo-1494666.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900" alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 md:px-10 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="label-tag">Stay Plugged</div>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mt-3">
              Catch every set on<br />
              <span className="text-[#FF007F]">our socials.</span>
            </h2>
            <p className="text-white/70 mt-5 max-w-md">Live mixes, behind-the-decks clips, lineup drops. Tap in.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="https://www.facebook.com/nightwavecollective" target="_blank" rel="noopener noreferrer" className="btn-secondary" data-testid="social-facebook-btn">
                <Facebook className="w-4 h-4" /> Facebook
              </a>
              <a href="https://www.instagram.com/nightwavecollective" target="_blank" rel="noopener noreferrer" className="btn-secondary" data-testid="social-instagram-btn">
                <Instagram className="w-4 h-4" /> Instagram
              </a>
              <a href="https://www.tiktok.com/@nightwavecollective" target="_blank" rel="noopener noreferrer" className="btn-secondary" data-testid="social-tiktok-btn">
                TikTok
              </a>
            </div>
          </div>
          <div className="glass rounded-3xl p-8 md:p-10 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#00E5FF] opacity-20 rounded-full blur-3xl" />
            <div className="label-tag">Booking</div>
            <h3 className="font-display text-2xl md:text-3xl font-bold mt-3">Reserve a date.<br />We'll handle the night.</h3>
            <p className="text-white/60 mt-4">Send us your event brief and our team will reach out via Facebook Messenger within 24 hours.</p>
            <Link to="/book" className="btn-primary mt-6" data-testid="cta-book-now-btn">
              Book Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
