"use client";

import { motion } from "motion/react";
import { Trophy, Users, Flame, Swords, Gem, Sparkles, type LucideIcon } from "lucide-react";
import { Avatar } from "./Avatar";

type Tone = "gold" | "green" | "sky" | "rose";
type Story = {
  kind: string;
  title: string;
  tone: Tone;
  name: string;
  id: number;
  text: string;
  metric: string;
};

const ICON: Record<string, LucideIcon> = {
  leader: Trophy,
  contrarian: Users,
  risky: Flame,
  threat: Swords,
  rare: Gem,
};

const TONE: Record<Tone, { ring: string; accent: string; metric: string }> = {
  gold: { ring: "text-gold", accent: "from-gold-soft/50 to-gold/10 dark:from-gold-soft/20 dark:to-gold/10", metric: "text-gold" },
  green: { ring: "text-green-deep", accent: "from-green/25 to-green/5", metric: "text-green-deep" },
  sky: { ring: "text-sky", accent: "from-sky/20 to-sky/5 dark:from-sky/15", metric: "text-sky" },
  rose: { ring: "text-rose", accent: "from-rose/20 to-rose/5", metric: "text-rose" },
};

export function StoriesOfDay({ stories }: { stories: Story[] }) {
  if (!stories.length) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stories.map((s, i) => {
        const Icon = ICON[s.kind] ?? Sparkles;
        const t = TONE[s.tone];
        return (
          <motion.div
            key={s.kind + i}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: (i % 4) * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="glass glass-hover relative flex flex-col overflow-hidden p-4"
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${t.accent} opacity-70`} />
            <div className="relative flex flex-1 flex-col">
              <div className="flex items-center justify-between">
                <span className={`grid size-10 place-items-center rounded-2xl bg-white/70 ${t.ring} ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10`}>
                  <Icon className="size-5" strokeWidth={2.3} />
                </span>
                {s.name && <Avatar name={s.name} seed={s.id} size={32} />}
              </div>
              <div className="mt-3 w-fit rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted dark:bg-white/[0.07]">
                {s.title}
              </div>
              {s.name && <div className="mt-1.5 text-[15px] font-extrabold leading-tight">{s.name}</div>}
              <p className="mt-1 text-[12.5px] leading-snug text-ink-soft">{s.text}</p>
              <div className={`mt-auto pt-3 text-[14px] font-extrabold ${t.metric}`}>{s.metric}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
