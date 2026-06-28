"use client";

import { useRef, useState } from "react";
import { Target } from "lucide-react";
import { plural } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { Flag } from "./Flag";
import { Sheet } from "./Sheet";

type Pair = { home: string; away: string; stage: string; homeFlag: string; awayFlag: string };
type Leader = { id: number; name: string; avatarSeed: number; count: number; pairs: Pair[] };

const RANK_TONE = ["bg-gold/15 text-gold", "bg-black/[0.07] text-ink-soft dark:bg-white/12", "bg-[#cf8b4d]/15 text-[#cf8b4d]"];

export function PairLeaders({ leaders }: { leaders: Leader[] }) {
  const [sel, setSel] = useState<Leader | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="glass overflow-hidden p-1.5">
      <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
        {leaders.map((l, i) => (
          <li key={l.id}>
            <button
              type="button"
              disabled={l.count === 0}
              aria-haspopup={l.count > 0 ? "dialog" : undefined}
              onClick={(e) => {
                triggerRef.current = e.currentTarget;
                setSel(l);
              }}
              className={`flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition-colors sm:px-3 ${
                l.count > 0 ? "hover:bg-white/55 dark:hover:bg-white/[0.05]" : "cursor-default opacity-55"
              }`}
            >
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-extrabold tabular-nums ${
                  RANK_TONE[i] ?? "bg-black/[0.05] text-muted dark:bg-white/[0.07]"
                }`}
              >
                {i + 1}
              </span>
              <Avatar name={l.name} seed={l.avatarSeed} size={36} />
              <span className="min-w-0 flex-1 truncate text-[14px] font-bold">{l.name}</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold tabular-nums ${
                  l.count > 0 ? "bg-sky/10 text-sky" : "text-muted"
                }`}
              >
                <Target className="size-3.5" strokeWidth={2.6} />
                {l.count} {plural(l.count, "пара", "пары", "пар")}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Sheet
        open={!!sel}
        onClose={() => setSel(null)}
        returnFocusRef={triggerRef}
        label={sel ? `Пары, которые угадал ${sel.name}` : undefined}
      >
        {sel && (
          <>
            <div className="flex items-center gap-2.5 pr-8">
              <Avatar name={sel.name} seed={sel.avatarSeed} size={38} />
              <div>
                <div className="font-display text-[16px] font-extrabold leading-tight">{sel.name}</div>
                <div className="inline-flex items-center gap-1 text-[12px] font-bold text-sky">
                  <Target className="size-3.5" strokeWidth={2.6} />
                  угадал {sel.count} {plural(sel.count, "пару", "пары", "пар")} плей-офф
                </div>
              </div>
            </div>
            <ul className="mt-3.5 max-h-[55vh] space-y-1.5 overflow-y-auto">
              {sel.pairs.map((p, i) => (
                <li
                  key={i}
                  className="rounded-xl bg-white/55 px-3 py-2 ring-1 ring-black/5 dark:bg-white/8 dark:ring-white/12"
                >
                  <div className="text-[10px] font-bold uppercase tracking-wide text-green-deep">{p.stage}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[14px] font-bold">
                    <Flag code={p.homeFlag} name={p.home} w={18} />
                    <span>{p.home}</span>
                    <span className="text-muted">—</span>
                    <span>{p.away}</span>
                    <Flag code={p.awayFlag} name={p.away} w={18} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Sheet>
    </div>
  );
}
