"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Hidden easter-egg: wraps any content in a button that, on click, opens a
 * centered modal playing a short video WITH SOUND. Because the modal is opened
 * by the user's click (a user gesture), the subsequent play() is allowed to be
 * unmuted; if a browser still blocks it, the native controls let them press play.
 * Rendered via a portal to <body> so the fixed overlay is viewport-relative.
 */
export function EasterEgg({
  videoSrc,
  className,
  children,
  label = "Пасхалка",
}: {
  videoSrc: string;
  className?: string;
  children: ReactNode;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.muted = false;
      v.volume = 1;
      v.play().catch(() => {
        /* unmuted autoplay blocked — native controls remain for a manual press */
      });
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (v) v.pause();
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={label} className={className}>
        {children}
      </button>

      {mounted && open &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={label}
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
                src={videoSrc}
                controls
                playsInline
                autoPlay
                onEnded={() => setOpen(false)}
                className="mx-auto max-h-[82vh] w-auto max-w-full rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]"
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
