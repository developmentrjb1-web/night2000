import { MessageCircle } from "lucide-react";

export default function MessengerButton() {
  return (
    <a
      href="https://m.me/nightwavecollective"
      target="_blank"
      rel="noopener noreferrer"
      data-testid="floating-messenger-btn"
      aria-label="Message us on Facebook"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#FF007F] text-white flex items-center justify-center shadow-[0_0_30px_rgba(255,0,127,0.45)] hover:scale-110 transition-transform pulse-glow"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
}
