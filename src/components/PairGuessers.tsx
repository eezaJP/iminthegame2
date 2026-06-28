"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Target, X } from "lucide-react";
import { Avatar } from "./Avatar";
import { Flag } from "./Flag";

type Guesser = { name: string; seed: number };

const overlayV = { hidden: { opacity: 0 }, show: { opacity: 1 } };
const sheetV = {
  hidden: { y: "100%" },
  show: { y: 0, transition: { type: "spring" as const, stiffness: 380, damping: 38 } },
};
const modalV = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 440, damping: 32 } },
};

export function PairGuessers({
  count,
  guessers,
  home,
  away,
  homeFlag,
  awayFlag,
  stage,
  total,
  icon = false,
}: {
  count: number;
  guessers: Guesser[];
  home: string;
  away: string;
  homeFlag?: string;
  awayFlag?: string;
  stage?: string;
  total?: number;
  icon?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const clickable = count > 0;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => closeRef.current?.focus(), 60);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      {clickable ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label={`Кто угадал пару ${home} — ${away}`}
          className="inline-flex items-center gap-1 rounded-full bg-sky/10 px-2 py-[3px] text-[13px] font-bold tabular-nums text-sky transition-transform active:scale-90"
        >
          {icon && <Target className="size-3.5" strokeWidth={2.6} />}
          {count}
        </button>
      ) : (
        <span className="inline-flex items-center gap-1 text-[13px] font-bold tabular-nums text-muted">
          {icon && <Target className="size-3.5" strokeWidth={2.6} />}
          {count}
        </span>
      )}

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[100] flex h-[100dvh] w-screen items-end justify-center sm:items-center sm:p-4"
            initial="hidden"
            animate="show"
            exit="hidden"
          >
            <motion.div
              className="absolute inset-0 bg-black/55"
              variants={overlayV}
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`Угадали пару ${home} — ${away}`}
              variants={isMobile ? sheetV : modalV}
              drag={isMobile ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 110 || info.velocity.y > 600) setOpen(false);
              }}
              className="relative z-10 w-full max-w-none touch-pan-y rounded-t-[28px] border border-black/10 bg-[var(--bg)] p-5 pb-7 shadow-[0_-12px_50px_-10px_rgba(0,0,0,0.5)] dark:border-white/12 sm:max-w-[320px] sm:rounded-[24px] sm:pb-5 sm:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.55)]"
            >
              {/* grab handle (mobile sheet) */}
              <div className="mx-auto mb-3.5 h-1.5 w-10 rounded-full bg-ink/15 dark:bg-white/20 sm:hidden" />

              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Закрыть"
                className="absolute right-3.5 top-3.5 grid size-8 place-items-center rounded-full bg-black/[0.05] text-muted transition-colors hover:text-ink dark:bg-white/[0.08]"
              >
                <X className="size-4" strokeWidth={2.4} />
              </button>

              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-green-deep">
                {stage ? `${stage} · кто угадал` : "Кто угадал пару"}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 pr-8 font-display text-[16px] font-extrabold leading-tight">
                {homeFlag && <Flag code={homeFlag} name={home} w={20} />}
                <span>{home}</span>
                <span className="text-muted">—</span>
                <span>{away}</span>
                {awayFlag && <Flag code={awayFlag} name={away} w={20} />}
              </div>

              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sky/12 px-2.5 py-1 text-[12px] font-bold text-sky">
                <Target className="size-3.5" strokeWidth={2.6} />
                {count}
                {total ? ` из ${total}` : ""} угадали пару
              </div>

              <ul className="mt-3.5 max-h-[52vh] space-y-0.5 overflow-y-auto">
                {guessers.map((g, i) => (
                  <li key={g.name} className="flex items-center gap-3 rounded-xl px-1 py-1.5">
                    <span className="w-4 text-center font-mono text-[12px] font-bold tabular-nums text-muted">{i + 1}</span>
                    <Avatar name={g.name} seed={g.seed} size={32} />
                    <span className="text-[15px] font-bold">{g.name}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
