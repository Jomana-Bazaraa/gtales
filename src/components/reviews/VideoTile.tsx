"use client";
import { useEffect, useRef, useState } from "react";

/** Review video: plays muted while on screen, tap to turn the sound on or off. Loads only metadata until seen. */
export function VideoTile({ src }: { src: string }) {
  const v = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  useEffect(() => {
    const el = v.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) el.play().catch(() => {}); else el.pause(); }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <button type="button" onClick={() => { const el = v.current; if (!el) return; el.muted = !el.muted; setMuted(el.muted); if (el.paused) el.play().catch(() => {}); }}
      aria-label={muted ? "Turn sound on" : "Turn sound off"} className="relative block w-full rounded-xl overflow-hidden bg-black">
      <video ref={v} src={src} muted playsInline loop preload="metadata" className="w-full max-h-[420px] object-contain" />
      <span className="absolute bottom-2 right-2 rounded-full bg-black/60 text-white text-xs font-bold px-2.5 py-1">{muted ? "🔇 Tap for sound" : "🔊 Sound on"}</span>
    </button>
  );
}
