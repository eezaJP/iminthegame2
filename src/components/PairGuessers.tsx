"use client";

import { useRef, useState } from "react";
import { Target } from "lucide-react";
import { Avatar } from "./Avatar";
import { Flag } from "./Flag";
import { Sheet } from "./Sheet";

type Guesser = { name: string; seed: number };

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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const clickable = count > 0;

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

      <Sheet open={open} onClose={() => setOpen(false)} returnFocusRef={triggerRef} label={`Угадали пару ${home} — ${away}`}>
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
      </Sheet>
    </>
  );
}
