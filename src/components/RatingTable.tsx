"use client";

import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import Image from "next/image";
import { Crown, ArrowUp, ArrowDown, Minus, Info, X } from "lucide-react";
import type { Participant } from "@/lib/types";
import { flagUrl } from "@/lib/utils";
import { flagOf } from "@/lib/teams";
import { Avatar } from "./Avatar";

type Move = { id: number; delta: number };

function Champion({ name, out }: { name: string; out?: boolean }) {
  if (!name) return <span className="text-muted">—</span>;
  const code = flagOf(name);
  return (
    <span className="flex items-center gap-1.5 truncate">
      {code && <Image src={flagUrl(code, 40)} alt="" width={18} height={13} className={`h-[13px] w-[18px] shrink-0 rounded-[2px] object-cover ${out ? "opacity-55" : ""}`} unoptimized />}
      <span className={`truncate text-[13px] font-semibold ${out ? "text-muted line-through decoration-rose decoration-2" : ""}`}>{name}</span>
      {out && <X className="size-3.5 shrink-0 text-rose" strokeWidth={3.5} />}
    </span>
  );
}

function Delta({ delta }: { delta: number }) {
  if (delta > 0)
    return (
      <span className="inline-flex items-center gap-0.5 rounded-md bg-green/12 px-1.5 py-0.5 text-[11px] font-bold text-green-deep">
        <ArrowUp className="size-3" strokeWidth={3} />{delta}
      </span>
    );
  if (delta < 0)
    return (
      <span className="inline-flex items-center gap-0.5 rounded-md bg-rose/12 px-1.5 py-0.5 text-[11px] font-bold text-rose">
        <ArrowDown className="size-3" strokeWidth={3} />{Math.abs(delta)}
      </span>
    );
  return <Minus className="size-3.5 text-muted" strokeWidth={2.6} />;
}

const COLS = "grid-cols-[40px_minmax(0,1fr)_64px_56px_56px_minmax(0,130px)_64px]";

export function RatingTable({ players, movement }: { players: Participant[]; movement: Move[] }) {
  const deltaOf = new Map(movement.map((m) => [m.id, m.delta]));

  return (
    <div className="glass overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Полный рейтинг</h2>
          <span className="rounded-full bg-green/12 px-2.5 py-0.5 text-[11px] font-bold text-green-deep">
            {players.length} участников
          </span>
        </div>
      </div>

      {/* desktop column header */}
      <div className={`mt-3 hidden ${COLS} items-center gap-3 border-b border-black/5 px-5 pb-2 text-[10px] font-bold uppercase tracking-wide text-muted dark:border-white/10 md:grid`}>
        <span className="text-center">Место</span>
        <span>Участник</span>
        <span className="text-right">Очки</span>
        <span className="text-center">Точные</span>
        <span className="text-center">Исходы</span>
        <span>Чемпион</span>
        <span className="text-center">Δ</span>
      </div>

      <ul className="p-1.5">
        {players.map((p, i) => {
          const isLeader = p.rank === 1;
          const d = deltaOf.get(p.id) ?? 0;
          const rowCls = isLeader
            ? "bg-gradient-to-r from-green/12 to-transparent ring-1 ring-green/20"
            : "hover:bg-white/50 dark:hover:bg-white/[0.05]";
          return (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i * 0.02, 0.25), duration: 0.32 }}
              className={`rounded-2xl transition-colors ${rowCls}`}
            >
              {/* desktop row */}
              <div className={`hidden ${COLS} items-center gap-3 px-4 py-2.5 md:grid`}>
                <span className={`text-center font-mono text-[15px] font-bold tabular-nums ${isLeader ? "text-green-deep" : "text-muted"}`}>
                  {p.rank}
                </span>
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="relative shrink-0">
                    <Avatar name={p.name} seed={p.avatarSeed} size={34} />
                    {isLeader && <Crown className="absolute -right-1.5 -top-2.5 size-3.5 text-gold drop-shadow" strokeWidth={2.2} fill="#f6c453" />}
                  </div>
                  <span className="truncate text-[14px] font-bold">{p.name}</span>
                </div>
                <span className="text-right font-display text-[17px] font-extrabold tabular-nums">
                  <NumberFlow value={p.points.total} />
                </span>
                <span className="text-center text-[14px] font-bold tabular-nums text-gold">{p.stats.exactScores}</span>
                <span className="text-center text-[14px] font-bold tabular-nums text-ink-soft">{p.stats.correctOutcomes}</span>
                <Champion name={p.champion} out={p.championOut} />
                <span className="flex justify-center"><Delta delta={d} /></span>
              </div>

              {/* mobile row */}
              <div className="flex items-center gap-3 px-2.5 py-2.5 md:hidden">
                <span className={`w-6 text-center font-mono text-[14px] font-bold tabular-nums ${isLeader ? "text-green-deep" : "text-muted"}`}>
                  {p.rank}
                </span>
                <div className="relative shrink-0">
                  <Avatar name={p.name} seed={p.avatarSeed} size={36} />
                  {isLeader && <Crown className="absolute -right-1.5 -top-2.5 size-3.5 text-gold drop-shadow" strokeWidth={2.2} fill="#f6c453" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-bold">{p.name}</div>
                  <div className="text-[11px] font-semibold text-muted">
                    {p.stats.exactScores} точных · {p.stats.correctOutcomes} исходов
                  </div>
                </div>
                <Delta delta={d} />
                <span className="w-12 text-right font-display text-[17px] font-extrabold tabular-nums">{p.points.total}</span>
              </div>
            </motion.li>
          );
        })}
      </ul>

      <div className="flex items-center gap-2 border-t border-black/5 px-5 py-3 text-[12px] text-muted dark:border-white/10">
        <Info className="size-3.5 shrink-0" strokeWidth={2.2} />
        Рейтинг обновляется после каждого завершённого матча. Δ — движение за сегодня.
      </div>
    </div>
  );
}
