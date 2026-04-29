import { useEffect } from "react";
import { X } from "lucide-react";

export default function Lightbox({ src, caption, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
      onClick={onClose}
      data-testid="lightbox-overlay"
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white/80 hover:text-white"
        aria-label="Close"
        data-testid="lightbox-close-btn"
      >
        <X className="w-8 h-8" />
      </button>
      <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={caption} className="w-full max-h-[80vh] object-contain rounded-2xl border border-white/10" />
        {caption && <div className="mt-4 text-center text-white/70">{caption}</div>}
      </div>
    </div>
  );
}
