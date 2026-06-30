"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { RotateCcw, Play, Pause } from "lucide-react";
import { initials, ruDate } from "@/lib/utils";
import { AVATAR_PAIRS } from "./Avatar";

type Row = { name: string; seed: number; points: number[] };

const STEP_MS = 1000;       // 1 game day per second
const MAX_PCT = 68;         // leader's line tip reaches this % (leaves room for avatar + 3-digit value, even on narrow mobile)
const GLIDE = { duration: STEP_MS / 1000, ease: "linear" as const };
const REORDER = { layout: { duration: 0.65, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } };

export function GroupRace({ days, rows }: { days: string[]; rows: Row[] }) {
  const last = Math.max(0, days.length - 1);
  const [day, setDay] = useState(0);
  const [playing, setPlaying] = useState(false);
  const started = useRef(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const maxFinal = useMemo(() => Math.max(10, ...rows.map((r) => r.points[last] ?? 0)), [rows, last]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && !started.current) { started.current = true; setPlaying(true); } },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || day >= last) return;
    const id = setTimeout(() => setDay((d) => Math.min(d + 1, last)), STEP_MS);
    return () => clearTimeout(id);
  }, [playing, day, last]);

  const atEnd = day >= last;
  const toggle = () => (atEnd ? (setDay(0), setPlaying(true)) : setPlaying((p) => !p));

  const ordered = useMemo(
    () => rows.map((r) => ({ ...r, cur: r.points[day] ?? 0 })).sort((a, b) => b.cur - a.cur || a.name.localeCompare(b.name)),
    [rows, day],
  );

  return (
    <div ref={wrapRef} className="glass overflow-hidden p-4 sm:p-5">
      <div className="mb-3.5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-green-deep">
            <span className="live-dot inline-block size-1.5 rounded-full bg-rose" />Гонка LIVE · весь турнир
          </div>
          <div className="font-display text-[18px] font-extrabold leading-tight sm:text-[20px]">
            День {day + 1}<span className="text-muted">/{days.length}</span>
            <span className="ml-2 text-[14px] font-semibold text-muted">{ruDate(days[day])}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={atEnd ? "Заново" : playing ? "Пауза" : "Старт"}
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-green-deep text-white shadow-sm transition-transform active:scale-90"
        >
          {atEnd ? <RotateCcw className="size-4" strokeWidth={2.6} /> : playing ? <Pause className="size-4" strokeWidth={2.6} /> : <Play className="size-4" strokeWidth={2.6} />}
        </button>
      </div>

      <div className="flex flex-col gap-1">
        {ordered.map((r, i) => {
          const [from, to] = AVATAR_PAIRS[r.seed % AVATAR_PAIRS.length];
          const pct = (r.cur / maxFinal) * MAX_PCT;
          const leader = i === 0 && r.cur > 0;
          const av = leader ? 28 : 24;
          return (
            <motion.div key={r.name} layout transition={REORDER} className="flex items-center gap-2 sm:gap-2.5">
              <span className={`w-5 shrink-0 text-right font-mono text-[12px] font-bold tabular-nums ${leader ? "text-green-deep" : "text-muted"}`}>{i + 1}</span>
              <span className="w-[76px] shrink-0 truncate text-[13px] font-bold sm:w-[104px]">{r.name}</span>
              <div className="relative h-8 flex-1">
                {/* faint full track */}
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-black/[0.07] dark:bg-white/10" />
                {/* thin coloured line */}
                <motion.div
                  className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full"
                  style={{ background: `linear-gradient(90deg, ${from}, ${to})` }}
                  initial={false}
                  animate={{ width: `${pct}%` }}
                  transition={GLIDE}
                />
                {/* avatar head + value riding the line tip */}
                <motion.div
                  className="absolute top-1/2 flex -translate-y-1/2 items-center gap-1.5"
                  initial={false}
                  animate={{ left: `${pct}%` }}
                  transition={GLIDE}
                >
                  <span
                    className="grid -translate-x-1/2 place-items-center rounded-full font-display font-bold text-white shadow-sm ring-2 ring-white/80 dark:ring-white/25"
                    style={{ width: av, height: av, fontSize: av * 0.36, background: `linear-gradient(135deg, ${from}, ${to})` }}
                  >
                    {initials(r.name)}
                  </span>
                  <span className="font-display text-[13.5px] font-extrabold tabular-nums" style={{ color: from }}>{r.cur}</span>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
