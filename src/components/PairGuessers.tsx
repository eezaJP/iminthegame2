"use client";

import { useEffect, useState } from "react";
import { Target, X } from "lucide-react";
import { Avatar } from "./Avatar";

type Guesser = { name: string; seed: number };

export function PairGuessers({
  count,
  guessers,
  home,
  away,
  stage,
  icon = false,
}: {
  count: number;
  guessers: Guesser[];
  home: string;
  away: string;
  stage?: string;
  icon?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const clickable = count > 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => clickable && setOpen(true)}
        aria-label={clickable ? `Кто угадал пару ${home} — ${away}` : undefined}
        className={`inline-flex items-center gap-1 text-[13px] font-bold tabular-nums text-sky ${
          clickable ? "cursor-pointer rounded hover:underline" : "cursor-default"
        }`}
      >
        {icon && <Target className="size-3.5" strokeWidth={2.6} />}
        {count}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/55" />
          <div
            className="relative z-10 w-full max-w-[300px] rounded-[22px] border border-black/10 bg-[var(--bg)] p-5 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.55)] dark:border-white/12"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Закрыть"
              className="absolute right-3 top-3 grid size-7 place-items-center rounded-lg text-muted transition-colors hover:bg-black/[0.05] hover:text-ink dark:hover:bg-white/[0.08]"
            >
              <X className="size-4" strokeWidth={2.4} />
            </button>

            {stage && <div className="text-[10px] font-bold uppercase tracking-wide text-green-deep">{stage}</div>}
            <div className="mt-0.5 font-display text-[16px] font-extrabold leading-tight">
              {home} — {away}
            </div>
            <div className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-sky">
              <Target className="size-3.5" strokeWidth={2.6} />
              Угадали пару: {count}
            </div>

            <ul className="mt-3.5 max-h-[55vh] space-y-2 overflow-y-auto">
              {guessers.map((g) => (
                <li key={g.name} className="flex items-center gap-2.5">
                  <Avatar name={g.name} seed={g.seed} size={30} />
                  <span className="text-[14px] font-bold">{g.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
