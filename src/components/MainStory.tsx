"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { HeroTrophy } from "./HeroTrophy";
import { NextMatchCountdown } from "./NextMatchCountdown";
import type { NextMatch } from "@/lib/types";

type Story = {
  kind: "rest" | "leadChange" | "top3" | "gap";
  title: string;
  text: string;
  potential: number;
  matchCount: number;
};

export function MainStory({ story, nextMatches }: { story: Story; nextMatches: NextMatch[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative flex min-h-[260px] flex-col overflow-hidden px-5 py-6 sm:px-7 sm:py-7"
    >
      {/* ambient gradient */}
      <div className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-br from-green/15 via-transparent to-gold/15 opacity-80 dark:from-green/10 dark:to-gold/10" />
      {/* trophy backdrop (right) */}
      <motion.div
        whileHover={{ rotate: 1.5, scale: 1.04 }}
        transition={{ type: "spring", stiffness: 180, damping: 16 }}
        className="pointer-events-none absolute -right-2 bottom-0 top-0 hidden w-[30%] max-w-[220px] opacity-60 sm:block"
      >
        <HeroTrophy className="size-full" />
      </motion.div>

      <div className="relative z-10 flex flex-1 flex-col">
        <span className="chip w-fit bg-gold/12 text-gold">
          <Sparkles className="size-3.5" strokeWidth={2.6} />
          Главная интрига дня
        </span>

        <h1 className="mt-3 max-w-[34rem] font-display text-[26px] font-extrabold leading-[1.05] tracking-tight sm:text-[34px]">
          {story.title}
        </h1>

        {/* body text + next-match countdown, aligned by their top edge */}
        <div className="mt-2.5 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <p className="max-w-md text-[14px] font-medium leading-snug text-ink-soft sm:text-[15px]">
            {story.text}
          </p>
          {nextMatches.length > 0 && (
            <div className="shrink-0">
              <NextMatchCountdown matches={nextMatches} size="lg" />
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
