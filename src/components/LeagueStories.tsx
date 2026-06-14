"use client";

import { motion } from "motion/react";
import {
  Shuffle, Rocket, Gauge, Gem, Users, Crosshair, Trophy, Swords, Coins, BarChart3,
  type LucideIcon,
} from "lucide-react";
import type { Demo } from "@/lib/types";
import { flagUrl, plural } from "@/lib/utils";
import Image from "next/image";

function Card({
  icon: Icon, title, accent, ring, i, children,
}: {
  icon: LucideIcon; title: string; accent: string; ring: string; i: number; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: (i % 3) * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="glass glass-hover relative overflow-hidden p-4"
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-60`} />
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className={`grid size-7 place-items-center rounded-lg bg-white/70 ${ring} ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10`}>
            <Icon className="size-4" strokeWidth={2.4} />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{title}</span>
        </div>
        <div className="mt-2.5 text-[13.5px] leading-snug text-ink">{children}</div>
      </div>
    </motion.div>
  );
}

const B = ({ children }: { children: React.ReactNode }) => <span className="font-extrabold">{children}</span>;

export function LeagueStories({ facts }: { facts: Demo["facts"] }) {
  const champs = facts.leagueChampions.slice(0, 5);
  const maxC = Math.max(...champs.map((c) => c.count), 1);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Card icon={Shuffle} title="Матч, который перевернул таблицу" accent="from-violet-200/40 to-transparent dark:from-violet-500/15" ring="text-violet-600 dark:text-violet-300" i={0}>
        <B>{facts.tableTurner.match}</B> сдвинула <B>{facts.tableTurner.positions}</B> позиций в рейтинге.
      </Card>

      <Card icon={Rocket} title="Камбэк тура" accent="from-green/20 to-transparent" ring="text-green-deep" i={1}>
        <B>{facts.comeback.name}</B> поднялся на <B>{facts.comeback.places}</B>{" "}
        {plural(facts.comeback.places, "место", "места", "мест")} после {facts.comeback.round}-го тура.
      </Card>

      <Card icon={Gauge} title="Под давлением" accent="from-rose/15 to-transparent" ring="text-rose" i={2}>
        <B>{facts.underPressure.name}</B> потерял <B>{facts.underPressure.places}</B>{" "}
        {plural(facts.underPressure.places, "позицию", "позиции", "позиций")} — но ещё может вернуться.
      </Card>

      <Card icon={Gem} title="Редкий прогноз" accent="from-sky/15 to-transparent" ring="text-sky" i={3}>
        Только <B>{facts.rarePick.count} из {facts.rarePick.total}</B> поверили в{" "}
        <B>{facts.rarePick.team}</B> — и забрали очки.
      </Card>

      <Card icon={Users} title="Против толпы" accent="from-amber-200/40 to-transparent dark:from-amber-400/15" ring="text-gold" i={4}>
        <B>{facts.againstCrowd.name}</B> чаще всех выбирает непопулярные исходы.
      </Card>

      <Card icon={Crosshair} title="Почти оракул" accent="from-green/20 to-transparent" ring="text-green-deep" i={5}>
        <B>{facts.almostOracle.name}</B> уже <B>{facts.almostOracle.times}</B> раз промахнулся всего на один гол.
      </Card>

      <Card icon={Swords} title="Главная угроза лидеру" accent="from-rose/15 to-transparent" ring="text-rose" i={6}>
        <B>{facts.threat.name}</B> может обойти лидера сегодня, {facts.threat.condition}.
      </Card>

      <Card icon={Coins} title="Открытые очки дня" accent="from-gold-soft/40 to-transparent dark:from-gold-soft/15" ring="text-gold" i={7}>
        Сегодня в игре <B>{facts.openPoints.points}</B> потенциальных очков.
      </Card>

      <Card icon={BarChart3} title="Счёт большинства" accent="from-sky/15 to-transparent" ring="text-sky" i={8}>
        Самый частый прогноз дня —{" "}
        <span className="rounded-md bg-ink px-1.5 py-0.5 font-mono text-[12px] font-bold text-bg">
          {facts.majorityScore.score}
        </span>
        .
      </Card>

      {/* champions distribution — spans wider where room allows */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="glass relative overflow-hidden p-4 sm:col-span-2 lg:col-span-3"
      >
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-white/70 text-gold ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
            <Trophy className="size-4" strokeWidth={2.4} />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Кого выбрала лига · прогноз на чемпиона</span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {champs.map((c) => (
            <div key={c.team} className="flex items-center gap-2 text-[13px]">
              {c.flag && (
                <Image src={flagUrl(c.flag, 40)} alt="" width={18} height={13}
                  className="h-[13px] w-[18px] rounded-[2px] object-cover" unoptimized />
              )}
              <span className="w-20 shrink-0 truncate font-semibold">{c.team}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-green to-gold" style={{ width: `${(c.count / maxC) * 100}%` }} />
              </div>
              <span className="w-4 text-right font-mono font-bold tabular-nums">{c.count}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
