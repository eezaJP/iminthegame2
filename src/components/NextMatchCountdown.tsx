"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { flagUrl } from "@/lib/utils";

type M = { time: string; home: string; away: string; homeFlag: string; awayFlag: string };

const pad = (n: number) => String(n).padStart(2, "0");

/** Next kickoff among today's matches, anchored to the client's "today" so the timer is live. */
function nextOf(matches: M[]) {
  const now = new Date();
  let best: { t: number; m: M } | null = null;
  for (const m of matches) {
    const [h, mm] = m.time.split(":").map(Number);
    const d = new Date();
    d.setHours(h, mm, 0, 0);
    if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
    const t = d.getTime();
    if (!best || t < best.t) best = { t, m };
  }
  return best;
}

export function NextMatchCountdown({ matches }: { matches: M[] }) {
  const [state, setState] = useState<{ label: string; m: M; left: string } | null>(null);

  useEffect(() => {
    if (!matches.length) return;
    const tick = () => {
      const nx = nextOf(matches);
      if (!nx) return;
      const ms = nx.t - Date.now();
      const s = Math.max(0, Math.floor(ms / 1000));
      const left = `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
      setState({ label: `${nx.m.time} МСК`, m: nx.m, left });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [matches]);

  if (!matches.length) return null;

  return (
    <div className="inline-flex items-center gap-3 rounded-2xl bg-white/55 px-4 py-2.5 ring-1 ring-black/5 dark:bg-white/8 dark:ring-white/12">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">До следующего матча</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[13px] font-bold">
          {state ? (
            <>
              <Image src={flagUrl(state.m.homeFlag, 40)} alt="" width={16} height={12}
                className="h-3 w-4 rounded-[2px] object-cover" unoptimized />
              <span>{state.m.home}</span>
              <span className="text-muted">—</span>
              <Image src={flagUrl(state.m.awayFlag, 40)} alt="" width={16} height={12}
                className="h-3 w-4 rounded-[2px] object-cover" unoptimized />
              <span>{state.m.away}</span>
            </>
          ) : (
            <span className="text-muted">…</span>
          )}
        </div>
      </div>
      <div className="ml-1 border-l border-black/10 pl-3 text-right dark:border-white/15">
        <div className="font-mono text-xl font-bold tabular-nums leading-none text-ink sm:text-2xl">
          {state?.left ?? "—"}
        </div>
        <div className="mt-0.5 text-[10px] font-medium text-muted">{state?.label ?? ""}</div>
      </div>
    </div>
  );
}
