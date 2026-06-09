"use client";

import { motion } from "motion/react";
import { Users, Radio } from "lucide-react";
import { ScrambleText } from "./ScrambleText";
import { NextMatchCountdown } from "./NextMatchCountdown";
import { HeroTrophy } from "./HeroTrophy";

const HOST_COLORS = { us: "#16245f", ca: "#d12b2b", mx: "#0e7a3d" };

type M = { time: string; home: string; away: string; homeFlag: string; awayFlag: string };

function HostLine() {
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] font-extrabold uppercase tracking-[0.1em] sm:text-[14px]">
      <span style={{ color: HOST_COLORS.us }}>United States</span>
      <span className="text-ink/25">·</span>
      <span style={{ color: HOST_COLORS.ca }}>Canada</span>
      <span className="text-ink/25">·</span>
      <span style={{ color: HOST_COLORS.mx }}>Mexico</span>
    </div>
  );
}

export function Hero({
  participants,
  stats,
  todayMatches,
}: {
  participants: number;
  stats: { label: string; value: string }[];
  todayMatches: M[];
}) {
  return (
    <section className="relative mt-3 overflow-hidden glass px-5 py-6 sm:px-9 sm:py-7">
      <HeroTrophy className="pointer-events-none absolute right-5 top-1/2 hidden h-[90%] w-[26%] max-w-[260px] -translate-y-1/2 lg:block" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-[660px]"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip bg-green/12 text-green-deep">
            <Radio className="size-3.5" strokeWidth={2.4} />
            Турнир идёт · 3-й тур групп
          </span>
          <span className="chip bg-white/60 text-ink-soft ring-1 ring-black/5">
            <Users className="size-3.5" strokeWidth={2.4} />
            {participants} участников
          </span>
        </div>

        <h1 className="mt-4 font-display text-[32px] font-extrabold leading-[0.95] tracking-tight sm:text-[50px]">
          <ScrambleText text="FIFA WORLD" className="block" speed={85} />
          <span className="text-gradient">
            <ScrambleText text="CUP 2026" speed={120} />
          </span>
        </h1>

        <HostLine />

        <p className="mt-3 max-w-md text-[14px] font-semibold leading-snug text-ink-soft sm:text-[15px]">
          15 друзей. Один чемпион. Все прогнозы зафиксированы до старта.
        </p>

        <div className="mt-5">
          <NextMatchCountdown matches={todayMatches} />
        </div>

        <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-black/5 pt-4">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-display text-xl font-extrabold tabular-nums text-ink sm:text-2xl">
                {s.value}
              </div>
              <div className="text-[11px] font-medium text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="relative mt-6 flex justify-center lg:hidden">
        <HeroTrophy className="h-44 w-28" />
      </div>
    </section>
  );
}
