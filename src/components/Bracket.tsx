import { Trophy } from "lucide-react";
import type { BracketMatch, BracketPreview, BracketTeam } from "@/lib/types";
import { Flag } from "./Flag";

function TeamRow({
  team,
  score,
  win,
}: {
  team: BracketTeam;
  score: number;
  win: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-1.5 ${
        win ? "bg-green/[0.07]" : ""
      }`}
    >
      {win && <span className="-ml-2.5 h-7 w-[3px] rounded-r bg-green" />}
      <Flag code={team.flag} name={team.name} w={18} />
      <span className={`flex-1 truncate text-[12.5px] ${win ? "font-bold" : "font-medium text-ink-soft"}`}>
        {team.name}
      </span>
      <span className={`font-mono text-[13px] tabular-nums ${win ? "font-extrabold" : "text-muted"}`}>
        {score}
      </span>
    </div>
  );
}

function MatchCard({ m }: { m: BracketMatch }) {
  const aWin = m.winner.name === m.a.name;
  return (
    <div className="glass-soft w-[208px] overflow-hidden">
      <TeamRow team={m.a} score={m.scoreA} win={aWin} />
      <div className="h-px bg-black/[0.06]" />
      <TeamRow team={m.b} score={m.scoreB} win={!aWin} />
    </div>
  );
}

const POINTS: Record<string, string> = {
  r16: "5 / 12",
  qf: "8 / 18",
  sf: "15 / 35",
  f: "25 / 55",
};

export function Bracket({ data }: { data: BracketPreview }) {
  const champ = data.champion;
  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max items-stretch gap-5">
          {data.rounds.map((round) => (
            <div key={round.key} className="flex flex-col">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                  {round.title}
                </span>
                <span className="chip bg-green/10 px-2 py-0.5 text-[10px] text-green-deep">
                  {POINTS[round.key]}
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-around gap-3">
                {round.matches.map((m, i) => (
                  <MatchCard key={i} m={m} />
                ))}
              </div>
            </div>
          ))}

          {/* champion column */}
          <div className="flex flex-col">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gold">
              Чемпион
            </div>
            <div className="flex flex-1 items-center">
              <div className="glass relative w-[200px] overflow-hidden p-4 text-center">
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold-soft/50 to-gold/10"
                  aria-hidden
                />
                <div className="relative">
                  <Trophy className="mx-auto size-7 text-gold" strokeWidth={2} fill="#f6c453" />
                  <div className="mt-2 flex justify-center">
                    <Flag code={champ.flag} name={champ.name} w={34} />
                  </div>
                  <div className="mt-2 font-display text-lg font-extrabold">{champ.name}</div>
                  <div className="text-[11px] font-semibold text-muted">поднимает кубок</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3rd place */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
          Матч за 3-е место
        </span>
        <span className="chip bg-gold/10 px-2 py-0.5 text-[10px] text-gold">12 / 28</span>
        <MatchCard m={data.third} />
        <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
          <span className="inline-block size-2.5 rounded-full" style={{ background: "#cd7f48" }} />
          {data.third.winner.name} — бронза
        </span>
      </div>
    </div>
  );
}
