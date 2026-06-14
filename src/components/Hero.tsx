"use client";

import { motion } from "motion/react";
import { Users, Radio } from "lucide-react";
import { ScrambleText } from "./ScrambleText";
import { NextMatchCountdown } from "./NextMatchCountdown";
import { HeroTrophy } from "./HeroTrophy";
import type { NextMatch } from "@/lib/types";

/* каскадное появление: контейнер раздаёт задержки детям */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

function HostLine() {
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] font-extrabold uppercase tracking-[0.1em] sm:text-[14px]">
      <span className="text-[var(--host-us)]">United States</span>
      <span className="text-ink/25">·</span>
      <span className="text-[var(--host-ca)]">Canada</span>
      <span className="text-ink/25">·</span>
      <span className="text-[var(--host-mx)]">Mexico</span>
    </div>
  );
}

export function Hero({
  participants,
  stats,
  nextMatches,
}: {
  participants: number;
  stats: { label: string; value: string }[];
  nextMatches: NextMatch[];
}) {
  return (
    <section
      className="relative mt-3 overflow-hidden glass px-5 py-6 sm:px-9 sm:py-7 [--host-us:#16245f] [--host-ca:#d12b2b] [--host-mx:#0e7a3d] dark:[--host-us:#8fa3f5] dark:[--host-ca:#f57f7f] dark:[--host-mx:#5fd693]"
    >
      <motion.div
        whileHover={{ rotate: 1.5, scale: 1.03 }}
        transition={{ type: "spring", stiffness: 180, damping: 16 }}
        className="pointer-events-auto absolute right-5 top-1/2 hidden h-[90%] w-[26%] max-w-[260px] -translate-y-1/2 lg:block"
      >
        <HeroTrophy className="size-full" />
      </motion.div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative max-w-[660px]"
      >
        <motion.div variants={rise} className="flex flex-wrap items-center gap-2">
          <span className="chip bg-green/12 text-green-deep">
            <Radio className="size-3.5" strokeWidth={2.4} />
            Турнир идёт · 3-й тур групп
          </span>
          <span className="chip bg-white/60 text-ink-soft ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
            <Users className="size-3.5" strokeWidth={2.4} />
            {participants} участников
          </span>
        </motion.div>

        <motion.h1
          variants={rise}
          className="mt-4 font-display text-[32px] font-extrabold leading-[0.95] tracking-tight sm:text-[50px]"
        >
          <ScrambleText text="FIFA WORLD" className="block" speed={85} />
          <span className="text-gradient">
            <ScrambleText text="CUP 2026" speed={120} />
          </span>
        </motion.h1>

        <motion.div variants={rise}>
          <HostLine />
        </motion.div>

        <motion.p
          variants={rise}
          className="mt-3 max-w-md text-[14px] font-semibold leading-snug text-ink-soft sm:text-[15px]"
        >
          15 друзей. Один чемпион. Все прогнозы зафиксированы до старта.
        </motion.p>

        <motion.div variants={rise} className="mt-5">
          <NextMatchCountdown matches={nextMatches} />
        </motion.div>

        <motion.div
          variants={rise}
          className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-black/5 pt-4 dark:border-white/10"
        >
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-display text-xl font-extrabold tabular-nums text-ink sm:text-2xl">
                {s.value}
              </div>
              <div className="text-[11px] font-medium text-muted">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <div className="relative mt-6 flex justify-center lg:hidden">
        <HeroTrophy className="h-44 w-28" />
      </div>
    </section>
  );
}
