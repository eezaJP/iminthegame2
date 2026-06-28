"use client";

import { motion } from "motion/react";
import { CalendarClock, Coins, GitFork, Trophy } from "lucide-react";
import { HeroTrophy } from "./HeroTrophy";

type Props = {
  phase: "group" | "playoff";
  matchesLeft: number;
  seasonPotential: number;
  roundLabel: string;
  koMatchesLeft: number;
  playoffPotential: number;
};

function StatCard({ icon: Icon, label, value, sub, tone }: {
  icon: typeof Coins; label: string; value: string; sub: string; tone: "green" | "gold";
}) {
  return (
    <div className="glass-soft min-w-[150px] px-4 py-3.5">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted">
        <Icon className="size-3.5" strokeWidth={2.4} />
        {label}
      </div>
      <div className={`mt-1.5 font-display text-[30px] font-extrabold leading-none tabular-nums ${tone === "green" ? "text-green-deep" : "text-gold"}`}>
        {value}
      </div>
      <div className="mt-1 text-[11px] font-semibold text-muted">{sub}</div>
    </div>
  );
}

export function RatingHero({ phase, matchesLeft, seasonPotential, roundLabel, koMatchesLeft, playoffPotential }: Props) {
  const isPlayoff = phase === "playoff";
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative overflow-hidden px-5 py-6 sm:px-7 sm:py-7"
    >
      <div className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-br from-gold/15 via-transparent to-green/15 opacity-80 dark:from-gold/10 dark:to-green/10" />
      <motion.div
        whileHover={{ rotate: 1.5, scale: 1.04 }}
        transition={{ type: "spring", stiffness: 180, damping: 16 }}
        className="pointer-events-none absolute bottom-0 right-[26%] top-0 hidden w-[22%] max-w-[180px] opacity-60 lg:block"
      >
        <HeroTrophy className="size-full" />
      </motion.div>

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-md">
          <div className="flex items-center gap-2">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-green-deep">Рейтинг участников</div>
            <span className={`chip px-2 py-0.5 text-[10px] ${isPlayoff ? "bg-gold/12 text-gold" : "bg-green/12 text-green-deep"}`}>
              {isPlayoff ? `Плей-офф · ${roundLabel}` : "Групповой этап"}
            </span>
          </div>
          <h1 className="mt-1 font-display text-[28px] font-extrabold leading-[1.05] tracking-tight sm:text-[36px]">
            Борьба за чемпионство
          </h1>
          <p className="mt-2.5 text-[14px] font-medium leading-snug text-ink-soft sm:text-[15px]">
            {isPlayoff
              ? "Групповой этап позади — впереди вылет. Здесь решается всё: цена ошибки максимальная."
              : "Каждый матч может всё изменить. Следите за рейтингом, смотрите, кто поднимается, а кто теряет очки."}
          </p>
        </div>

        <div className="flex shrink-0 gap-3">
          {isPlayoff ? (
            <>
              <StatCard icon={GitFork} label="Матчей в плей-офф" value={String(koMatchesLeft)} sub="до чемпиона" tone="green" />
              <StatCard icon={Trophy} label="Ещё разыгрывается" value={`до ${playoffPotential}`} sub="очков в плей-офф" tone="gold" />
            </>
          ) : (
            <>
              <StatCard icon={CalendarClock} label="До конца групп" value={String(matchesLeft)} sub="матчей осталось" tone="green" />
              <StatCard icon={Coins} label="Потенциал у каждого" value={`до ${seasonPotential}`} sub="очков ещё в игре" tone="gold" />
            </>
          )}
        </div>
      </div>
    </motion.section>
  );
}
