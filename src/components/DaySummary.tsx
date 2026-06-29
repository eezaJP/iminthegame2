"use client";

import { useRef, useState } from "react";
import { Clock4, ArrowRight, Trophy, Coins, Target } from "lucide-react";
import { plural } from "@/lib/utils";
import { flagOf } from "@/lib/teams";
import { Avatar } from "./Avatar";
import { Flag } from "./Flag";
import { Sheet } from "./Sheet";

type Item = { kind: "match" | "bonus" | "group" | "bet"; label: string; detail: string; points: number; home?: string; away?: string };
type Row = { id: number; name: string; avatarSeed: number; rank: number; gained: number; items: Item[] };

const KIND_ICON = { match: Target, bonus: Trophy, group: Target, bet: Coins } as const;

export function DaySummary({
  rows,
  dayLabel,
  linkHref = "/playoff",
  linkLabel = "Сетка плей-офф",
}: {
  rows: Row[];
  dayLabel?: string;
  linkHref?: string;
  linkLabel?: string;
}) {
  const [sel, setSel] = useState<Row | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const total = rows.reduce((s, r) => s + r.gained, 0);
  const movers = rows.filter((r) => r.gained > 0).length;

  return (
    <section className="glass p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-white/70 text-green-deep ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
            <Clock4 className="size-4" strokeWidth={2.4} />
          </span>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Сводка за игровой день</h2>
        </div>
        {dayLabel && <span className="shrink-0 text-[11px] font-semibold text-green-deep">{dayLabel}</span>}
      </div>

      <p className="mt-2 text-[12.5px] leading-snug text-muted">
        {total > 0 ? (
          <>Разыграно <b className="font-bold text-ink">{total}</b> {plural(total, "очко", "очка", "очков")} — у {movers} {plural(movers, "участника", "участников", "участников")}. Нажми на очки — за что начислено.</>
        ) : (
          "Пока не сыграно ни одного матча — очки появятся после первых игр."
        )}
      </p>

      <ul className="mt-2.5 divide-y divide-black/[0.06] dark:divide-white/[0.07]">
        {rows.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              disabled={r.gained === 0}
              aria-haspopup={r.gained > 0 ? "dialog" : undefined}
              onClick={(e) => { triggerRef.current = e.currentTarget; setSel(r); }}
              className={`flex w-full items-center gap-2.5 rounded-xl px-1.5 py-2 text-left transition-colors ${
                r.gained > 0 ? "hover:bg-white/55 dark:hover:bg-white/[0.05]" : "cursor-default"
              }`}
            >
              <span className="w-4 shrink-0 text-right font-mono text-[11px] font-semibold tabular-nums text-muted">{r.rank}</span>
              <Avatar name={r.name} seed={r.avatarSeed} size={28} />
              <span className={`min-w-0 flex-1 truncate text-[13.5px] ${r.gained > 0 ? "font-bold" : "font-medium text-ink-soft"}`}>{r.name}</span>
              {r.gained > 0 ? (
                <span className="shrink-0 rounded-md bg-green/12 px-1.5 py-0.5 font-mono text-[12px] font-bold tabular-nums text-green-deep">+{r.gained}</span>
              ) : (
                <span className="shrink-0 font-mono text-[12px] font-semibold tabular-nums text-muted">0</span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <a href={linkHref} className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-green-deep transition-colors hover:text-green">
        {linkLabel}
        <ArrowRight className="size-3.5" strokeWidth={2.6} />
      </a>

      <Sheet
        open={!!sel}
        onClose={() => setSel(null)}
        returnFocusRef={triggerRef}
        label={sel ? `Очки ${sel.name} за 24 часа` : undefined}
      >
        {sel && (
          <>
            <div className="flex items-center gap-2.5 pr-8">
              <Avatar name={sel.name} seed={sel.avatarSeed} size={38} />
              <div>
                <div className="font-display text-[16px] font-extrabold leading-tight">{sel.name}</div>
                <div className="text-[12px] font-bold text-green-deep">
                  +{sel.gained} {plural(sel.gained, "очко", "очка", "очков")} за игровой день
                </div>
              </div>
            </div>
            <ul className="mt-3.5 max-h-[55vh] space-y-1.5 overflow-y-auto">
              {sel.items.map((it, i) => {
                const Icon = KIND_ICON[it.kind];
                return (
                  <li key={i} className="flex items-center gap-3 rounded-xl bg-white/55 px-3 py-2 ring-1 ring-black/5 dark:bg-white/8 dark:ring-white/12">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-green/10 text-green-deep">
                      <Icon className="size-3.5" strokeWidth={2.4} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13.5px] font-bold leading-tight">
                        {it.home && <Flag code={flagOf(it.home)} name={it.home} w={16} />}
                        <span className="truncate">{it.label}</span>
                        {it.away && <Flag code={flagOf(it.away)} name={it.away} w={16} />}
                      </div>
                      <div className="mt-0.5 text-[11px] font-medium text-muted">{it.detail}</div>
                    </div>
                    <span className="shrink-0 rounded-md bg-green/12 px-1.5 py-0.5 font-mono text-[12.5px] font-extrabold tabular-nums text-green-deep">+{it.points}</span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Sheet>
    </section>
  );
}
