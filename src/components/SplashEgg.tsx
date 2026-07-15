"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Volume2 } from "lucide-react";
import { track } from "@vercel/analytics";

// One-off splash easter-egg: the clip opens by itself on the FIRST visit during
// the time window below (any page), then never again for that visitor
// (localStorage flag is set the moment it shows — watching or closing both count).
// Unlike EasterEgg, it is NOT user-initiated, so unmuted autoplay would be blocked:
// it starts muted with a "включить звук" button; tapping the video also unmutes.
const SPLASH_SRC = "/fra-esp-semi.mp4";
const SPLASH_FROM = Date.parse("2026-07-15T00:55:00Z");
const SPLASH_TO = Date.parse("2026-07-15T08:55:00Z");
const SEEN_KEY = "wc-splash-fra-esp-semi";

export function SplashEgg() {
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const now = Date.now();
    if (now < SPLASH_FROM || now > SPLASH_TO) return;
    try {
      if (localStorage.getItem(SEEN_KEY)) return;
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      return;
    }
    track("easter_egg", { media: SPLASH_SRC, trigger: "splash" });
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      videoRef.current?.pause();
    };
  }, [open]);

  const unmute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.volume = 1;
    setMuted(false);
    v.play().catch(() => {});
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Пасхалка"
    >
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Закрыть"
          className="absolute -top-11 right-0 grid size-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
        >
          <X className="size-5" strokeWidth={2.4} />
        </button>
        <video
          ref={videoRef}
          src={SPLASH_SRC}
          controls
          playsInline
          autoPlay
          muted
          onClick={() => muted && unmute()}
          onEnded={() => setOpen(false)}
          className="mx-auto max-h-[82vh] w-auto max-w-full rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]"
        />
        {muted && (
          <button
            type="button"
            onClick={unmute}
            className="absolute bottom-16 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/30"
          >
            <Volume2 className="size-4" strokeWidth={2.4} />
            Включить звук
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
