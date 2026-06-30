"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { flagUrl } from "@/lib/utils";
import type { NextMatch } from "@/lib/types";

const pad = (n: number) => String(n).padStart(2, "0");

/** Next not-yet-started match, by real kickoff timestamp (timezone-independent). */
export function NextMatchCountdown({ matches, size = "md" }: { matches: NextMatch[]; size?: "md" | "lg" }) {
  const lg = size === "lg";
  const [state, setState] = useState<{ m: NextMatch; left: string } | null>(null);

  useEffect(() => {
    if (!matches.length) return;
    const tick = () => {
      const now = Date.now();
      const nx = matches.filter((m) => m.kickoff > now).sort((a, b) => a.kickoff - b.kickoff)[0];
      if (!nx) { setState(null); return; }
      const s = Math.max(0, Math.floor((nx.kickoff - now) / 1000));
      const left = `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
      setState({ m: nx, left });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [matches]);

  if (!matches.length || !state) return null;

  const fw = lg ? "h-4 w-[22px]" : "h-3 w-4";
  return (
    <div
      className={`rounded-2xl bg-white/65 ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/12 ${
        lg
          ? "flex w-full flex-col gap-2.5 px-5 py-3.5 sm:inline-flex sm:w-auto sm:flex-row sm:items-center sm:gap-4"
          : "inline-flex items-center gap-3 px-4 py-2.5"
      }`}
    >
      <div className="min-w-0">
        <div className={`font-bold uppercase tracking-[0.14em] text-muted ${lg ? "text-[11px]" : "text-[10px]"}`}>До следующего матча</div>
        <div className={`mt-1 flex items-center gap-1.5 font-bold ${lg ? "text-[15px]" : "text-[13px]"}`}>
          <Image src={flagUrl(state.m.homeFlag, 40)} alt="" width={22} height={16}
            className={`${fw} shrink-0 rounded-[2px] object-cover`} unoptimized />
          <span className="truncate">{state.m.home}</span>
          <span className="shrink-0 text-muted">—</span>
          <Image src={flagUrl(state.m.awayFlag, 40)} alt="" width={22} height={16}
            className={`${fw} shrink-0 rounded-[2px] object-cover`} unoptimized />
          <span className="truncate">{state.m.away}</span>
        </div>
      </div>
      <div
        className={`text-ink ${
          lg
            ? "flex w-full items-baseline justify-between gap-3 border-t border-black/10 pt-2.5 dark:border-white/15 sm:ml-1 sm:w-auto sm:flex-col sm:items-end sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 sm:text-right"
            : "ml-1 border-l border-black/10 pl-3 text-right dark:border-white/15"
        }`}
      >
        <div className={`font-mono font-bold tabular-nums leading-none ${lg ? "text-[32px] sm:text-[40px]" : "text-xl sm:text-2xl"}`}>
          {state.left}
        </div>
        <div className={`font-medium text-muted ${lg ? "text-[11px] sm:mt-1" : "mt-1 text-[10px]"}`}>{state.m.time} МСК</div>
      </div>
    </div>
  );
}
