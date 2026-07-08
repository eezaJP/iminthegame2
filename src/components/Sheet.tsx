"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { track } from "@vercel/analytics";

// group the many per-item labels into a few analytics buckets
// (PairGuessers "Угадали пару X — Y", PairLeaders "Пары, которые угадал X",
//  DaySummary "Очки X за 24 часа")
function modalKind(label?: string): string {
  const l = (label ?? "").toLowerCase();
  if (l.includes("которые угадал")) return "pair_leader";
  if (l.includes("угадал")) return "pair_guessers";
  if (l.includes("очки") || l.includes("24 часа") || l.includes("сводка")) return "day_breakdown";
  return "other";
}

const overlayV = { hidden: { opacity: 0 }, show: { opacity: 1 } };
const sheetV = {
  hidden: { y: "100%" },
  show: { y: 0, transition: { type: "spring" as const, stiffness: 380, damping: 38 } },
};
const modalV = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 440, damping: 32 } },
};

/**
 * Reusable overlay: a native bottom sheet on mobile (slide-up, grab handle,
 * drag-down to dismiss), a centered modal on desktop. Rendered via a portal to
 * document.body so position:fixed is viewport-relative (immune to transformed
 * ancestors). Solid opaque card — no nested backdrop-filter (breaks on iOS).
 */
export function Sheet({
  open,
  onClose,
  returnFocusRef,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
  label?: string;
  children: ReactNode;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!open) return;
    track("modal_open", { kind: modalKind(label) });
    const ret = returnFocusRef?.current;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => closeRef.current?.focus(), 60);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
      ret?.focus();
    };
  }, [open, onClose, returnFocusRef]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex h-[100dvh] w-screen items-end justify-center sm:items-center sm:p-4"
          initial="hidden"
          animate="show"
          exit="hidden"
        >
          <motion.div className="absolute inset-0 bg-black/55" variants={overlayV} onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            variants={isMobile ? sheetV : modalV}
            drag={isMobile ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose();
            }}
            className="relative z-10 w-full max-w-none touch-pan-y rounded-t-[28px] border border-black/10 bg-[var(--bg)] p-5 pb-7 shadow-[0_-12px_50px_-10px_rgba(0,0,0,0.5)] dark:border-white/12 sm:max-w-[340px] sm:rounded-[24px] sm:pb-5 sm:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.55)]"
          >
            <div className="mx-auto mb-3.5 h-1.5 w-10 rounded-full bg-ink/15 dark:bg-white/20 sm:hidden" />
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="absolute right-3.5 top-3.5 grid size-8 place-items-center rounded-full bg-black/[0.05] text-muted transition-colors hover:text-ink dark:bg-white/[0.08]"
            >
              <X className="size-4" strokeWidth={2.4} />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
