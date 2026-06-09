import { Trophy, Target, Flame } from "lucide-react";
import type { PoMatch, PoRound, PoTeam } from "@/lib/playoff";
import { Flag } from "./Flag";

type Mode = "real" | "majority" | "participant";

const POINTS: Record<string, string> = { r16: "5 / 12", qf: "8 / 18", sf: "15 / 35", f: "25 / 55" };

function TeamLine({
  team, score, win, dim, accent,
}: {
  team: PoTeam;
  score?: number | null;
  win: boolean;
  dim?: boolean;
  accent: string; // tailwind bg for the winner strip
}) {
  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 ${win ? "bg-black/[0.03]" : ""} ${dim ? "opacity-45" : ""}`}>
      {win ? <span className={`-ml-2.5 h-7 w-[3px] rounded-r ${accent}`} /> : <span className="-ml-2.5 w-[3px]" />}
      {team ? (
        <>
          <Flag code={team.f} name={team.n} w={18} />
          <span className={`flex-1 truncate text-[12.5px] ${win ? "font-bold" : "font-medium text-ink-soft"}`}>{team.n}</span>
        </>
      ) : (
        <span className="flex-1 text-[12.5px] font-medium text-muted">—</span>
      )}
      {score != null && (
        <span className={`font-mono text-[13px] tabular-nums ${win ? "font-extrabold" : "text-muted"}`}>{score}</span>
      )}
    </div>
  );
}

function PoMatchCard({ m, mode }: { m: PoMatch; mode: Mode }) {
  const aWin = !!m.winner && m.a?.n === m.winner.n;
  const bWin = !!m.winner && m.b?.n === m.winner.n;
  const dead = mode === "participant" && m.state === "dead";
  const exact = mode === "participant" && m.state === "exact";
  const hit = mode === "participant" && m.state === "hit";
  const alive = mode === "participant" && m.state === "alive";
  const accent = exact ? "bg-gold" : dead ? "bg-black/20" : hit || alive ? "bg-green" : "bg-ink/40";

  return (
    <div className={`glass-soft w-[206px] overflow-hidden ${dead ? "ring-1 ring-black/5" : ""}`}>
      <TeamLine team={m.a} score={m.scoreA} win={aWin} dim={dead} accent={accent} />
      <div className="h-px bg-black/[0.06]" />
      <TeamLine team={m.b} score={m.scoreB} win={bWin} dim={dead} accent={accent} />

      {/* footer annotations */}
      {(mode === "real" && m.pens) && (
        <div className="bg-black/[0.03] px-2.5 py-1 text-[10px] font-semibold text-muted">по пенальти · счёт ОТ</div>
      )}
      {mode === "majority" && m.votes != null && (
        <div className="flex items-center justify-between bg-black/[0.03] px-2.5 py-1 text-[10px] font-semibold text-muted">
          <span>{m.winner?.n}</span>
          <span className="text-green-deep">{m.votes}/{m.total} {m.score ? `· ${m.score}` : ""}</span>
        </div>
      )}
      {mode === "participant" && m.state && (
        <div className="flex items-center gap-1 bg-black/[0.03] px-2.5 py-1 text-[10px] font-bold">
          {exact && <span className="text-gold"><Target className="mr-1 inline size-3" strokeWidth={2.6} />точный счёт</span>}
          {hit && <span className="text-green-deep">угадан проход</span>}
          {alive && <span className="text-green-deep"><Flame className="mr-1 inline size-3" strokeWidth={2.6} />ещё в игре</span>}
          {(m.state === "miss") && <span className="text-muted">мимо</span>}
          {dead && <span className="text-muted">сгорел — команда не дошла</span>}
        </div>
      )}
    </div>
  );
}

export function PlayoffBracket({
  rounds, champion, mode, championStatus,
}: {
  rounds: PoRound[];
  champion: PoTeam;
  mode: Mode;
  championStatus?: string;
}) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max items-stretch gap-5">
        {rounds.map((round) => (
          <div key={round.key} className="flex flex-col">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">{round.title}</span>
              {POINTS[round.key] && (
                <span className="chip bg-green/10 px-2 py-0.5 text-[10px] text-green-deep">{POINTS[round.key]}</span>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-around gap-3">
              {round.matches.map((m, i) => (
                <PoMatchCard key={i} m={m} mode={mode} />
              ))}
            </div>
          </div>
        ))}

        {/* champion column */}
        <div className="flex flex-col">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gold">Чемпион</div>
          <div className="flex flex-1 items-center">
            <div className="glass relative w-[190px] overflow-hidden p-4 text-center">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold-soft/45 to-gold/10" aria-hidden />
              <div className="relative">
                <Trophy className="mx-auto size-7 text-gold" strokeWidth={2} fill="#f6c453" />
                {champion ? (
                  <>
                    <div className="mt-2 flex justify-center"><Flag code={champion.f} name={champion.n} w={32} /></div>
                    <div className="mt-2 font-display text-lg font-extrabold">{champion.n}</div>
                    {championStatus && <div className="text-[11px] font-semibold text-muted">{championStatus}</div>}
                  </>
                ) : (
                  <div className="mt-2 text-[13px] font-bold text-ink-soft">Кубок ещё ждёт победителя</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
