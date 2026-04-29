import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Lightbox from "@/components/Lightbox";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "events", label: "Events" },
  { key: "djs", label: "DJs" },
  { key: "crowd", label: "Crowd" },
];

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.get("/gallery").then(({ data }) => setItems(data)).catch(() => {});
  }, []);

  const filtered = filter === "all" ? items : items.filter((i) => i.category === filter);

  return (
    <div className="min-h-screen" data-testid="gallery-page">
      <section className="relative py-20 md:py-28 border-b border-white/5">
        <div className="absolute inset-0 overflow-hidden">
          <div className="orb" style={{ width: 360, height: 360, background: "#FF007F", top: "10%", right: "-10%" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 md:px-10">
          <div className="label-tag">Gallery</div>
          <h1 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter mt-4">
            Moments from <span className="text-[#00E5FF]">the booth.</span>
          </h1>
          <p className="text-white/60 mt-4 max-w-xl">Crowds, decks, lights — selected highlights from our recent nights.</p>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="flex flex-wrap gap-3 mb-8" data-testid="gallery-filters">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                data-testid={`gallery-filter-${f.key}`}
                className={`px-5 py-2 rounded-full border text-xs uppercase tracking-widest transition-all ${
                  filter === f.key
                    ? "bg-[#00E5FF] text-black border-[#00E5FF]"
                    : "border-white/15 text-white/70 hover:border-white/40 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filtered.map((g, i) => (
              <button
                key={g.id}
                onClick={() => setActive(g)}
                data-testid={`gallery-item-${g.id}`}
                className={`group relative overflow-hidden rounded-2xl border border-white/10 hover:border-[#FF007F]/40 transition-all ${i % 5 === 0 ? "row-span-2 aspect-[3/5]" : "aspect-square"}`}
              >
                <img src={g.url} alt={g.caption} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-3 left-3 right-3 text-left">
                  <div className="text-[10px] uppercase tracking-widest text-[#00E5FF]">{g.category}</div>
                  <div className="text-sm text-white/80">{g.caption}</div>
                </div>
              </button>
            ))}
          </div>
          {filtered.length === 0 && <div className="text-white/50 mt-10">No items in this category yet.</div>}
        </div>
      </section>

      <Lightbox src={active?.url} caption={active?.caption} onClose={() => setActive(null)} />
    </div>
  );
}
