"use client";

import { motion } from "motion/react";
import { Target, CheckCircle2, TrendingUp, Crosshair, Flame, Gem, Swords, Star, type LucideIcon } from "lucide-react";
import { Avatar } from "./Avatar";

type Tone = "gold" | "green" | "sky" | "rose";
type Card = { key: string; title: string; tone: Tone; icon: string; name: string; id: number; value: string; sub: string };

const ICON: Record<string, LucideIcon> = {
  target: Target,
  check: CheckCircle2,
  trend: TrendingUp,
  crosshair: Crosshair,
  flame: Flame,
  gem: Gem,
  swords: Swords,
};

const TONE: Record<Tone, { ring: string; accent: string; value: string }> = {
  gold: { ring: "text-gold", accent: "from-gold-soft/45 to-gold/10 dark:from-gold-soft/20 dark:to-gold/10", value: "text-gold" },
  green: { ring: "text-green-deep", accent: "from-green/25 to-green/5", value: "text-green-deep" },
  sky: { ring: "text-sky", accent: "from-sky/20 to-sky/5 dark:from-sky/15", value: "text-sky" },
  rose: { ring: "text-rose", accent: "from-rose/20 to-rose/5", value: "text-rose" },
};

export function BestByCategory({ cards }: { cards: Card[] }) {
  if (!cards.length) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((c, i) => {
        const Icon = ICON[c.icon] ?? Star;
        const t = TONE[c.tone];
        const longValue = c.value.length > 4;
        return (
          <motion.div
            key={c.key}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: (i % 6) * 0.05, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="glass glass-hover relative flex flex-col items-center overflow-hidden p-4 text-center"
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${t.accent} opacity-70`} />
            <div className="relative flex flex-1 flex-col items-center">
              <span className={`grid size-11 place-items-center rounded-2xl bg-white/70 ${t.ring} ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10`}>
                <Icon className="size-5" strokeWidth={2.3} />
              </span>
              <div className="mt-3 text-[10px] font-bold uppercase leading-tight tracking-wide text-muted">{c.title}</div>
              <div className="mt-2 flex items-center gap-1.5">
                <Avatar name={c.name} seed={c.id} size={24} />
                <span className="truncate text-[13px] font-bold">{c.name}</span>
              </div>
              <div className={`mt-2 font-display font-extrabold leading-none ${t.value} ${longValue ? "text-[18px]" : "text-[26px]"}`}>
                {c.value}
              </div>
              <div className="mt-auto pt-1.5 text-[10.5px] font-medium leading-snug text-muted">{c.sub}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
