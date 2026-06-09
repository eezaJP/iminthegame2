"use client";

import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { Crown, Target, TrendingUp } from "lucide-react";
import Image from "next/image";
import type { Participant } from "@/lib/types";
import { flagUrl } from "@/lib/utils";
import { flagOf, roundGainOf } from "@/lib/data";
import { Avatar } from "./Avatar";
import { ScrambleText } from "./ScrambleText";

const MEDAL = ["#b9740a", "#79858f", "#a5663a"];
const MEDAL_FACE = ["medal-gold", "medal-silver", "medal-bronze"];

function ChampionChip({ champion }: { champion: string }) {
  const code = flagOf(champion);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-ink-soft ring-1 ring-black/5">
      {code && (
        <Image src={flagUrl(code, 40)} alt="" width={16} height={11}
          className="h-[11px] w-4 rounded-[2px] object-cover" unoptimized />
      )}
      {champion}
    </span>
  );
}

function Podium({ top3 }: { top3: Participant[] }) {
  const order = [1, 0, 2];
  const gapFrom2nd = top3.length >= 2 ? top3[0].points.total - top3[1].points.total : 0;
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
      {order.map((idx, col) => {
        const p = top3[idx];
        if (!p) return <div key={col} />;
        const place = idx + 1;
        const isGold = idx === 0;
        const round = roundGainOf(p);
        const cardDelay = 0.1 + (2 - idx) * 0.28;
        const pDelay = cardDelay + 0.55;
        const nDelay = cardDelay + 0.8;
        const aDelay = cardDelay + 1.05;
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.8, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: cardDelay, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className={`glass-hover relative flex flex-col items-center rounded-[22px] border border-white/55 px-2 pb-4 pt-5 text-center shadow-[0_16px_38px_-14px_rgba(12,26,20,0.45)] ${
              isGold ? "sm:-translate-y-2" : "mt-3 sm:mt-6"
            }`}
          >
            <span className={`medal-face ${MEDAL_FACE[idx]}`} style={{ animationDelay: `${idx * 0.6}s` }} aria-hidden>
              <span className="medal-glint" style={{ animationDelay: `${0.5 + idx * 0.8}s` }} />
            </span>

            <span className="absolute -top-3 z-20 grid size-7 place-items-center rounded-full text-[13px] font-extrabold text-white shadow-sm ring-2 ring-white"
              style={{ background: MEDAL[idx] }}>
              {place}
            </span>
            {isGold && (
              <>
                <Crown className="absolute -top-7 z-20 size-6 text-gold drop-shadow" strokeWidth={2.2} fill="#f6c453" />
                <span className="absolute -top-3 right-2 z-20 rounded-full bg-ink/85 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
                  Лидер
                </span>
              </>
            )}

            <motion.div initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: aDelay, type: "spring", stiffness: 220, damping: 16 }} className="relative z-10">
              <Avatar name={p.name} seed={p.avatarSeed} size={isGold ? 58 : 46} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: nDelay, duration: 0.4 }}
              className="relative z-10 mt-2 line-clamp-1 text-[13px] font-bold sm:text-sm">
              <ScrambleText text={p.name} speed={70} startDelay={Math.round(nDelay * 1000)} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pDelay, duration: 0.4 }} className="relative z-10 mt-1">
              <div className="font-display text-2xl font-extrabold tabular-nums sm:text-[28px]">
                <NumberFlow value={p.points.total} />
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-ink/55">очков</div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: pDelay + 0.15, duration: 0.4 }}
              className="relative z-10 mt-2 flex items-center gap-2 text-[11px] font-bold text-ink/70">
              <span className="inline-flex items-center gap-0.5"><Target className="size-3" strokeWidth={2.6} />{p.stats.exactScores}</span>
              <span className="text-ink/30">·</span>
              <span className="text-green-deep">+{round} за тур</span>
            </motion.div>

            {isGold && gapFrom2nd > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: pDelay + 0.25, duration: 0.4 }}
                className="relative z-10 mt-1 text-[11px] font-semibold text-ink/55">
                +{gapFrom2nd} от 2-го места
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: aDelay + 0.15, duration: 0.4 }} className="relative z-10 mt-2 hidden sm:block">
              <ChampionChip champion={p.champion} />
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function Leaderboard({ participants }: { participants: Participant[] }) {
  const top3 = participants.slice(0, 3);
  const rest = participants.slice(3);
  const leaderTotal = participants[0]?.points.total || 1;

  return (
    <div>
      <Podium top3={top3} />

      <ul className="glass mt-4 divide-y divide-black/[0.06] overflow-hidden p-1.5">
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
              className="group flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition-colors hover:bg-white/55 sm:px-3"
            >
              <span className="w-6 text-center font-mono text-sm font-bold tabular-nums text-muted">{p.rank}</span>
              <Avatar name={p.name} seed={p.avatarSeed} size={38} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[14px] font-bold">{p.name}</span>
                  <span className="hidden sm:block"><ChampionChip champion={p.champion} /></span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-green to-gold"
                      initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.03, duration: 0.7, ease: "easeOut" }} />
                  </div>
                  <span className="hidden w-16 shrink-0 text-right text-[11px] font-medium text-muted sm:inline">
                    −{gap} от лидера
                  </span>
                </div>
              </div>
              <span className="hidden items-center gap-1 rounded-full bg-green/10 px-2 py-1 text-[11px] font-bold text-green-deep sm:inline-flex" title="Очки за текущий тур">
                <TrendingUp className="size-3" strokeWidth={2.6} />+{round}
              </span>
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
