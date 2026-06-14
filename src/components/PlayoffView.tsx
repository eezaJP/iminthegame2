"use client";

import { useState } from "react";
import { Trophy, Medal } from "lucide-react";
import type { PlayoffParticipant } from "@/lib/playoff";
import { PlayoffBracket } from "./PlayoffBracket";
import { Flag } from "./Flag";

/** Group-stage view: each participant's blind bracket (locked predictions).
 *  The real bracket appears here once the knockout stage starts. */
export function PlayoffView({ brackets }: { brackets: PlayoffParticipant[] }) {
  // default to the first participant who actually filled a bracket
  const firstFilled = brackets.find((b) => b.rounds.some((r) => r.matches.length)) ?? brackets[0];
  const [pid, setPid] = useState(firstFilled?.id ?? 0);
  const p = brackets.find((b) => b.id === pid) ?? brackets[0];
  if (!p) return null;

  return (
    <div className="glass p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-md text-[12.5px] text-muted">
          Слепые сетки участников — зафиксированы до старта. Реальная сетка появится здесь, когда стартует плей-офф.
        </p>
        <select
          value={pid}
          onChange={(e) => setPid(Number(e.target.value))}
          className="cursor-pointer rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-[12.5px] font-semibold text-ink outline-none ring-green/30 focus:ring-2 dark:border-white/15 dark:bg-white/10"
        >
          {brackets.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* участник: его финальные ставки */}
      <div className="mb-4 grid grid-cols-1 gap-2 rounded-2xl bg-white/55 p-3.5 ring-1 ring-black/5 dark:bg-white/8 dark:ring-white/12 sm:grid-cols-3">
        <Bet icon={<Trophy className="size-4 text-gold" strokeWidth={2.4} />} label="Чемпион" team={p.champion} />
        <Bet icon={<Medal className="size-4 text-muted" strokeWidth={2.4} />} label="Финалист" team={p.finalist} />
        <Bet icon={<Medal className="size-4" style={{ color: "#cd7f48" }} strokeWidth={2.4} />} label="3-е место" team={p.third} />
      </div>

      {/* mode="majority" rendering = clean winner-highlight, no per-match badges */}
      <PlayoffBracket rounds={p.rounds} champion={p.champion} mode="majority" championStatus="прогноз" third={p.thirdMatch} />
    </div>
  );
}

function Bet({ icon, label, team }: { icon: React.ReactNode; label: string; team: { n: string; f: string } | null }) {
  return (
    <div className="flex items-center gap-2 text-[13px]">
      {icon}
      <span className="text-muted">{label}:</span>
      {team && <Flag code={team.f} name={team.n} w={18} />}
      <span className="font-bold">{team?.n ?? "—"}</span>
    </div>
  );
}
