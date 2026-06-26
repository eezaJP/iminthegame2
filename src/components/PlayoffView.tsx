"use client";

import { useState } from "react";
import { Trophy, Medal, Users, Hourglass } from "lucide-react";
import type { PlayoffParticipant, PoRound, PoMatch, PoTeam } from "@/lib/playoff";
import { PlayoffBracket } from "./PlayoffBracket";
import { Flag } from "./Flag";

type RealBracket = { started: boolean; knownMatches: number; rounds: PoRound[]; third: PoMatch; champion: PoTeam };

/** Playoff view: switch between the REAL bracket (live knockout results) and any
 *  participant's blind bracket (locked predictions). */
export function PlayoffView({ brackets, real }: { brackets: PlayoffParticipant[]; real: RealBracket }) {
  // default to the first participant who actually filled a bracket
  const firstFilled = brackets.find((b) => b.rounds.some((r) => r.matches.length)) ?? brackets[0];
  const [view, setView] = useState<"real" | "participant">("participant");
  const [pid, setPid] = useState(firstFilled?.id ?? 0);
  const p = brackets.find((b) => b.id === pid) ?? brackets[0];

  return (
    <div className="glass p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-sm text-[12.5px] text-muted">
          {view === "real"
            ? "Настоящая сетка турнира — по живым результатам плей-офф."
            : "Слепые сетки участников — зафиксированы до старта."}
        </p>

        <div className="flex items-center gap-2">
          {/* dedicated button for the REAL bracket */}
          <button
            type="button"
            onClick={() => setView("real")}
            aria-pressed={view === "real"}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
              view === "real"
                ? "bg-gradient-to-r from-[#0e9f6e] to-[#0a7d55] text-white shadow-sm"
                : "bg-white/70 text-ink ring-1 ring-black/10 hover:text-green-deep dark:bg-white/10 dark:ring-white/15"
            }`}
          >
            <Trophy className="size-3.5" strokeWidth={2.4} />
            Реальная сетка
          </button>

          {/* participant picker */}
          <div className="relative">
            <Users className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" strokeWidth={2.4} />
            <select
              value={view === "participant" ? pid : ""}
              onChange={(e) => { setPid(Number(e.target.value)); setView("participant"); }}
              className={`cursor-pointer rounded-full border py-1.5 pl-8 pr-3 text-[12.5px] font-semibold outline-none ring-green/30 focus:ring-2 ${
                view === "participant"
                  ? "border-green/40 bg-white/80 text-ink dark:bg-white/12"
                  : "border-black/10 bg-white/55 text-muted dark:border-white/15 dark:bg-white/8"
              }`}
            >
              {view === "real" && <option value="" disabled hidden>Сетка участника…</option>}
              {brackets.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {view === "real" ? (
        <>
          <div className="mb-3 flex items-start gap-2 rounded-2xl bg-white/55 px-3.5 py-2.5 text-[12px] leading-snug text-ink-soft ring-1 ring-black/5 dark:bg-white/8 dark:ring-white/12">
            <Hourglass className="mt-0.5 size-3.5 shrink-0 text-gold" strokeWidth={2.4} />
            <span>
              Сетка заполняется по мере выхода команд: пара 1/16 встаёт, когда определены оба соперника, а команды
              с 3-х мест — в последнюю очередь.{" "}
              {real.knownMatches > 0
                ? `Уже известно пар 1/16: ${real.knownMatches} из 16.`
                : "Стадия на вылет ещё не стартовала."}
            </span>
          </div>
          <PlayoffBracket
            rounds={real.rounds}
            champion={real.champion}
            mode="real"
            championStatus={real.champion ? "чемпион" : undefined}
            third={real.third}
          />
        </>
      ) : (
        <>
          {/* participant's final bets */}
          <div className="mb-4 grid grid-cols-1 gap-2 rounded-2xl bg-white/55 p-3.5 ring-1 ring-black/5 dark:bg-white/8 dark:ring-white/12 sm:grid-cols-3">
            <Bet icon={<Trophy className="size-4 text-gold" strokeWidth={2.4} />} label="Чемпион" team={p.champion} />
            <Bet icon={<Medal className="size-4 text-muted" strokeWidth={2.4} />} label="Финалист" team={p.finalist} />
            <Bet icon={<Medal className="size-4" style={{ color: "#cd7f48" }} strokeWidth={2.4} />} label="3-е место" team={p.third} />
          </div>

          <PlayoffBracket rounds={p.rounds} champion={p.champion} mode="majority" championStatus="прогноз" third={p.thirdMatch} />
        </>
      )}
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
