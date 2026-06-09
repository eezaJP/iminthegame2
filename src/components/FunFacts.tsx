"use client";

import { motion } from "motion/react";
import { Flame, Sparkles, TrendingUp, ScanSearch } from "lucide-react";
import type { Demo } from "@/lib/types";
import { Avatar } from "./Avatar";

export function FunFacts({ awards }: { awards: Demo["awards"] }) {
  const cards = [
    {
      title: "Лидер лиги",
      name: awards.leader.name,
      metric: `${awards.leader.points.total} очков`,
      icon: Flame,
      accent: "from-gold-soft/60 to-gold/20",
      ring: "text-gold",
      id: awards.leader.id,
    },
    {
      title: "Оракул чемпионата",
      name: awards.oracle.name,
      metric: `${awards.oracle.stats.exactScores} точных счётов`,
      icon: Sparkles,
      accent: "from-green/25 to-green/5",
      ring: "text-green-deep",
      id: awards.oracle.id,
    },
    {
      title: "Прорыв тура",
      name: awards.roundLeader.name,
      metric: `+${awards.roundLeader.delta} за тур`,
      icon: TrendingUp,
      accent: "from-sky/20 to-sky/5",
      ring: "text-sky",
      id: awards.roundLeader.id,
    },
    {
      title: "Попал под VAR",
      name: awards.var.name,
      metric: `всего +${awards.var.delta} за тур`,
      icon: ScanSearch,
      accent: "from-rose/20 to-rose/5",
      ring: "text-rose",
      id: awards.var.id,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="glass glass-hover relative overflow-hidden p-3.5 sm:p-4"
          >
            <div className={`pointer-events-none absolute inset-0 -z-0 bg-gradient-to-br ${c.accent} opacity-70`} />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className={`grid size-8 place-items-center rounded-xl bg-white/70 ${c.ring} ring-1 ring-black/5`}>
                  <Icon className="size-4" strokeWidth={2.4} />
                </span>
                <Avatar name={c.name} seed={c.id} size={30} />
              </div>
              <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-muted">
                {c.title}
              </div>
              <div className="mt-0.5 truncate text-[15px] font-extrabold">{c.name}</div>
              <div className="mt-0.5 text-[12px] font-semibold text-ink-soft">{c.metric}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
