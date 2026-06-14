"use client";

import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { Crown, Target, TrendingUp } from "lucide-react";
import Image from "next/image";
import type { Participant } from "@/lib/types";
import { flagUrl } from "@/lib/utils";
import { flagOf } from "@/lib/teams";
import { Avatar } from "./Avatar";
import { ScrambleText } from "./ScrambleText";

const MEDAL = ["#b9740a", "#79858f", "#a5663a"];
const MEDAL_FACE = ["medal-gold", "medal-silver", "medal-bronze"];

/** Points gained in the last round, or null when per-round history isn't available yet. */
function roundGainOf(p: Participant): number | null {
  return p.history.length >= 3 ? p.history[2].total - p.history[1].total : null;
}

function ChampionChip({ champion }: { champion: string }) {
  const code = flagOf(champion);
  if (!champion) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-ink-soft ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
      {code && (
        <Image src={flagUrl(code, 40)} alt="" width={16} height={11}
          className="h-[11px] w-4 rounded-[2px] object-cover" unoptimized />
      )}
      {champion}
    </span>
  );
}

type PlaceGroup = { place: number; members: Participant[] };

function PodiumCard({ group, medalIdx, col }: { group: PlaceGroup; medalIdx: number; col: number }) {
  const { place, members } = group;
  const isGold = place === 1;
  const single = members.length === 1;
  const pts = members[0].points.total;
  const exact = members[0].stats.exactScores;
  const round = roundGainOf(members[0]);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.1 + col * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`glass-hover relative flex flex-col items-center rounded-[22px] border border-white/55 px-2 pb-4 pt-5 text-center shadow-[0_16px_38px_-14px_rgba(12,26,20,0.45)] dark:border-white/15 dark:shadow-[0_16px_38px_-14px_rgba(0,0,0,0.6)] ${
        isGold ? "sm:-translate-y-2" : "mt-3 sm:mt-6"
      }`}
    >
      <span className={`medal-face ${MEDAL_FACE[medalIdx]}`} style={{ animationDelay: `${medalIdx * 0.6}s` }} aria-hidden>
        <span className="medal-glint" style={{ animationDelay: `${0.5 + medalIdx * 0.8}s` }} />
      </span>

      <span className="absolute -top-3 z-20 grid size-7 place-items-center rounded-full text-[13px] font-extrabold text-bg shadow-sm ring-2 ring-white"
        style={{ background: MEDAL[medalIdx] }}>
        {place}
      </span>
      {isGold && <Crown className="absolute -top-7 z-20 size-6 text-gold drop-shadow" strokeWidth={2.2} fill="#f6c453" />}

      {/* avatar(s) */}
      <div className="relative z-10 flex items-center justify-center gap-1.5">
        {members.map((m) => (
          <Avatar key={m.id} name={m.name} seed={m.avatarSeed} size={single ? 58 : 40} />
        ))}
      </div>

      {/* name(s) */}
      <div className="relative z-10 mt-2 flex flex-col gap-0.5 text-[13px] font-bold leading-tight sm:text-sm">
        {single ? (
          <span className="line-clamp-1"><ScrambleText text={members[0].name} speed={70} /></span>
        ) : (
          members.map((m) => <span key={m.id} className="line-clamp-1">{m.name}</span>)
        )}
      </div>

      {/* shared points */}
      <div className="relative z-10 mt-1">
        <div className="font-display text-2xl font-extrabold tabular-nums sm:text-[28px]">
          <NumberFlow value={pts} />
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-ink/55">очков</div>
      </div>

      <div className="relative z-10 mt-2 flex items-center gap-2 text-[11px] font-bold text-ink/70">
        <span className="inline-flex items-center gap-0.5"><Target className="size-3" strokeWidth={2.6} />{exact}</span>
        {single && round !== null && (
          <>
            <span className="text-ink/30">·</span>
            <span className="text-green-deep">+{round} за тур</span>
          </>
        )}
      </div>

      {!single && (
        <div className="relative z-10 mt-1 text-[11px] font-semibold text-ink/55">делят {place}-е место</div>
      )}

      <div className="relative z-10 mt-2 hidden flex-wrap justify-center gap-1 sm:flex">
        {members.map((m) => <ChampionChip key={m.id} champion={m.champion} />)}
      </div>
    </motion.div>
  );
}

export function Leaderboard({ participants }: { participants: Participant[] }) {
  // group consecutive participants sharing the same (dense) place
  const groups: PlaceGroup[] = [];
  for (const p of participants) {
    const last = groups[groups.length - 1];
    if (last && last.place === p.rank) last.members.push(p);
    else groups.push({ place: p.rank, members: [p] });
  }
  const podium = groups.slice(0, 3);
  const podiumPlaces = new Set(podium.map((g) => g.place));
  const rest = participants.filter((p) => !podiumPlaces.has(p.rank));
  const leaderTotal = participants[0]?.points.total || 1;

  // visual order: silver (left) · gold (center) · bronze (right)
  const order = [1, 0, 2];

  return (
    <div>
      <div className="grid grid-cols-3 items-start gap-2.5 sm:gap-4">
        {order.map((gi, col) => {
          const g = podium[gi];
          if (!g) return <div key={col} />;
          return <PodiumCard key={g.place} group={g} medalIdx={Math.min(g.place - 1, 2)} col={col} />;
        })}
      </div>

      <ul className="glass mt-4 divide-y divide-black/[0.06] overflow-hidden p-1.5 dark:divide-white/[0.07]">
        {rest.map((p, i) => {
          const pct = Math.round((p.points.total / leaderTotal) * 100);
          const gap = leaderTotal - p.points.total;
          const round = roundGainOf(p);
          return (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03, duration: 0.35 }}
              className="group flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition-colors hover:bg-white/55 dark:hover:bg-white/8 sm:px-3"
            >
              <span className="w-6 text-center font-mono text-sm font-bold tabular-nums text-muted">{p.rank}</span>
              <Avatar name={p.name} seed={p.avatarSeed} size={38} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[14px] font-bold">{p.name}</span>
                  <span className="hidden sm:block"><ChampionChip champion={p.champion} /></span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-green to-gold"
                      initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.03, duration: 0.7, ease: "easeOut" }} />
                  </div>
                  <span className="hidden w-16 shrink-0 text-right text-[11px] font-medium text-muted sm:inline">
                    {gap > 0 ? `−${gap} от лидера` : "лидер"}
                  </span>
                </div>
              </div>
              {round !== null && (
                <span className="hidden items-center gap-1 rounded-full bg-green/10 px-2 py-1 text-[11px] font-bold text-green-deep sm:inline-flex" title="Очки за текущий тур">
                  <TrendingUp className="size-3" strokeWidth={2.6} />+{round}
                </span>
              )}
              <span className="hidden items-center gap-1 rounded-full bg-gold/10 px-2 py-1 text-[11px] font-bold text-gold sm:inline-flex" title="Угаданные точные счета">
                <Target className="size-3" strokeWidth={2.6} />{p.stats.exactScores}
              </span>
              <span className="ml-1 w-12 text-right font-display text-lg font-extrabold tabular-nums sm:w-14">
                <NumberFlow value={p.points.total} />
              </span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
