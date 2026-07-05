"use client";

import { useMemo, useRef, useState } from "react";
import { Target } from "lucide-react";
import { plural } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { Flag } from "./Flag";
import { Sheet } from "./Sheet";

type Pair = { home: string; away: string; stage: string; homeFlag: string; awayFlag: string };
type Leader = { id: number; name: string; avatarSeed: number; count: number; pairs: Pair[] };

// tournament-ordered knockout stages (labels must match KO_STAGE in realData.ts)
const STAGE_ORDER = ["1/16 финала", "1/8 финала", "1/4 финала", "1/2 финала", "за 3-е место", "финал"] as const;
const STAGE_CHIP: Record<string, string> = {
  all: "Все", "1/16 финала": "1/16", "1/8 финала": "1/8", "1/4 финала": "1/4",
  "1/2 финала": "1/2", "за 3-е место": "За 3-е", "финал": "Финалисты",
};

const RANK_TONE = ["bg-gold/15 text-gold", "bg-black/[0.07] text-ink-soft dark:bg-white/12", "bg-[#cf8b4d]/15 text-[#cf8b4d]"];

export function PairLeaders({ leaders, stages: activeStages }: { leaders: Leader[]; stages?: string[] }) {
  const [sel, setSel] = useState<Leader | null>(null);
  const [stage, setStage] = useState<string>("all");
  const triggerRef = useRef<HTMLButtonElement>(null);

  // stages to show as chips: every knockout stage that has actually STARTED (a real
  // pair exists), passed from the server — so a stage's chip appears the moment its
  // pairs are known, even if nobody guessed one yet. Falls back to stages that have
  // a guessed pair if the prop is absent. Kept in tournament order.
  const stages = useMemo(() => {
    const present = new Set<string>();
    if (activeStages && activeStages.length) {
      for (const s of activeStages) present.add(s);
    } else {
      for (const l of leaders) for (const p of l.pairs) present.add(p.stage);
    }
    return STAGE_ORDER.filter((s) => present.has(s));
  }, [leaders, activeStages]);

  // re-rank leaders by their guessed-pair count for the active stage filter
  const ranked = useMemo(() => {
    const countOf = (l: Leader) => (stage === "all" ? l.pairs.length : l.pairs.filter((p) => p.stage === stage).length);
    return leaders
      .map((l) => ({ ...l, shown: countOf(l) }))
      .sort((a, b) => b.shown - a.shown || a.name.localeCompare(b.name));
  }, [leaders, stage]);

  const leagueTotal = ranked.reduce((s, l) => s + l.shown, 0);

  // pairs shown inside the modal, honouring the active filter, tournament-ordered
  const selPairs = useMemo(() => {
    if (!sel) return [];
    const list = stage === "all" ? sel.pairs : sel.pairs.filter((p) => p.stage === stage);
    return [...list].sort((a, b) => STAGE_ORDER.indexOf(a.stage as typeof STAGE_ORDER[number]) - STAGE_ORDER.indexOf(b.stage as typeof STAGE_ORDER[number]));
  }, [sel, stage]);
  const selShown = sel ? (stage === "all" ? sel.pairs.length : sel.pairs.filter((p) => p.stage === stage).length) : 0;

  return (
    <div className="glass overflow-hidden p-1.5">
      {/* stage filter chips */}
      {stages.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto px-1 pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["all", ...stages].map((s) => {
            const active = stage === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStage(s)}
                aria-pressed={active}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors ${
                  active
                    ? "bg-sky text-white shadow-sm"
                    : "bg-black/[0.04] text-ink-soft hover:bg-black/[0.07] dark:bg-white/[0.06] dark:hover:bg-white/[0.1]"
                }`}
              >
                {STAGE_CHIP[s] ?? s}
              </button>
            );
          })}
        </div>
      )}

      {/* league total for the active filter */}
      <div className="flex items-center justify-between px-2.5 pb-1.5 pt-0.5 text-[11px] font-semibold text-muted">
        <span>{stage === "all" ? "Все стадии плей-офф" : STAGE_CHIP[stage]}</span>
        <span className="inline-flex items-center gap-1 text-sky">
          <Target className="size-3" strokeWidth={2.6} />
          в лиге угадано {leagueTotal} {plural(leagueTotal, "пара", "пары", "пар")}
        </span>
      </div>

      <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
        {ranked.map((l, i) => (
          <li key={l.id}>
            <button
              type="button"
              disabled={l.shown === 0}
              aria-haspopup={l.shown > 0 ? "dialog" : undefined}
              onClick={(e) => {
                triggerRef.current = e.currentTarget;
                setSel(l);
              }}
              className={`flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition-colors sm:px-3 ${
                l.shown > 0 ? "hover:bg-white/55 dark:hover:bg-white/[0.05]" : "cursor-default opacity-55"
              }`}
            >
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-extrabold tabular-nums ${
                  l.shown > 0 ? RANK_TONE[i] ?? "bg-black/[0.05] text-muted dark:bg-white/[0.07]" : "bg-black/[0.05] text-muted dark:bg-white/[0.07]"
                }`}
              >
                {i + 1}
              </span>
              <Avatar name={l.name} seed={l.avatarSeed} size={36} />
              <span className="min-w-0 flex-1 truncate text-[14px] font-bold">{l.name}</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold tabular-nums ${
                  l.shown > 0 ? "bg-sky/10 text-sky" : "text-muted"
                }`}
              >
                <Target className="size-3.5" strokeWidth={2.6} />
                {l.shown} {plural(l.shown, "пара", "пары", "пар")}
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
                  угадал {selShown} {plural(selShown, "пару", "пары", "пар")}
                  {stage === "all" ? " плей-офф" : ` в ${STAGE_CHIP[stage]}`}
                </div>
              </div>
            </div>
            <ul className="mt-3.5 max-h-[55vh] space-y-1.5 overflow-y-auto">
              {selPairs.map((p, i) => (
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
