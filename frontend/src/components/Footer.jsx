import { Link } from "react-router-dom";
import { Instagram, Facebook, Music2, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative mt-32 border-t border-white/5 bg-black" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="font-display text-2xl font-black tracking-tighter uppercase">Night Wave Collective</div>
          <p className="mt-4 text-white/60 max-w-md leading-relaxed">
            A community of DJs, MCs and event makers. Bookings, residencies, and unforgettable nights.
          </p>
          <div className="mt-6 flex items-center gap-4">
            <a href="https://www.facebook.com/nightwavecollective" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:text-[#00E5FF]" data-testid="footer-facebook">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="https://www.instagram.com/nightwavecollective" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:text-[#FF007F]" data-testid="footer-instagram">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="https://www.tiktok.com/@nightwavecollective" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:text-[#B026FF]" data-testid="footer-tiktok">
              <Music2 className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div>
          <div className="label-tag">Explore</div>
          <ul className="mt-4 space-y-2 text-white/70 text-sm">
            <li><Link to="/events" className="hover:text-[#00E5FF]">Events</Link></li>
            <li><Link to="/gallery" className="hover:text-[#00E5FF]">Gallery</Link></li>
            <li><Link to="/memberships" className="hover:text-[#00E5FF]">Memberships</Link></li>
            <li><Link to="/book" className="hover:text-[#00E5FF]">Book Us</Link></li>
          </ul>
        </div>

        <div>
          <div className="label-tag">Contact</div>
          <ul className="mt-4 space-y-2 text-white/70 text-sm">
            <li className="flex items-start gap-2">
              <Mail className="w-4 h-4 mt-1 text-[#00E5FF]" />
              <a href="mailto:nightwavecollectiveofficial@gmail.com" className="hover:text-white">nightwavecollectiveofficial@gmail.com</a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="w-4 h-4 mt-1 text-[#FF007F]" />
              <a href="mailto:developmentrjb1@gmail.com" className="hover:text-white">developmentrjb1@gmail.com</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-6 text-center text-white/40 text-xs tracking-widest uppercase">
        © {new Date().getFullYear()} Night Wave Collective. Feel the Beat. Ride the Wave.
      </div>
    </footer>
  );
}
