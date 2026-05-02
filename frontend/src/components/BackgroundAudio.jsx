import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Play } from "lucide-react";

const SRC = "/audio/edm-loop.mp3";

export default function BackgroundAudio() {
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [needsTap, setNeedsTap] = useState(true); // until user taps once

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = 0.35;
    a.muted = true;
    // Try silent autoplay (allowed when muted on most browsers)
    a.play().catch(() => { /* user gesture required */ });
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (needsTap) {
      a.muted = false;
      a.play().catch(() => {});
      setMuted(false);
      setNeedsTap(false);
      return;
    }
    if (a.paused) {
      a.play().catch(() => {});
      a.muted = false;
      setMuted(false);
      return;
    }
    a.muted = !a.muted;
    setMuted(a.muted);
  };

  return (
    <>
      <audio ref={audioRef} src={SRC} loop preload="auto" data-testid="bg-audio-element" />
      <button
        onClick={toggle}
        aria-label={muted ? "Unmute background music" : "Mute background music"}
        data-testid="bg-audio-toggle"
        className="fixed bottom-6 left-6 z-50 group flex items-center gap-2 pl-3 pr-4 py-2 rounded-full bg-black/70 backdrop-blur-xl border border-white/10 hover:border-[#00E5FF]/50 hover:shadow-[0_0_24px_rgba(0,229,255,0.25)] transition-all"
      >
        <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-[#00E5FF] via-[#B026FF] to-[#FF007F]">
          {needsTap ? (
            <Play className="w-3.5 h-3.5 text-black fill-black" />
          ) : muted ? (
            <VolumeX className="w-3.5 h-3.5 text-black" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-black" />
          )}
          {!muted && !needsTap && (
            <span className="absolute inset-0 rounded-full border border-[#00E5FF] animate-ping opacity-60" />
          )}
        </span>
        <span className="text-[10px] uppercase tracking-[0.25em] text-white/80 group-hover:text-white">
          {needsTap ? "Tap to unmute" : muted ? "Music off" : "Music on"}
        </span>
      </button>
    </>
  );
}
