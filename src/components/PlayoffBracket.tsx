import { Trophy, Target, Flame, Medal } from "lucide-react";
import type { PoMatch, PoRound, PoTeam } from "@/lib/playoff";
import { Flag } from "./Flag";
import { EasterEgg } from "./EasterEgg";
import { eggMediaFor } from "@/lib/easterEggs";

type Mode = "real" | "majority" | "participant";
type Fill = "win" | "out" | "none";

const POINTS: Record<string, string> = { r32: "3 / 8", r16: "5 / 12", qf: "8 / 18", sf: "15 / 35", f: "25 / 55" };
const LINE = "var(--line)";
const CARD_W = 154;
const GAP = 24;
const FINAL_W = 198;
const CELL_MIN = 60;

function TeamLine({ team, opponent, score, fill }: { team: PoTeam; opponent?: string; score?: number | null; fill: Fill }) {
  const bg = fill === "win" ? "bg-green/15" : fill === "out" ? "bg-rose/[0.09] opacity-55" : "";
  const strip = fill === "win" ? "bg-green" : "bg-transparent";
  const row = (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 ${bg}`}>
      <span className={`-ml-2.5 h-6 w-[3px] rounded-r ${strip}`} />
      {team ? (
        <>
          <Flag code={team.f} name={team.n} w={18} />
          <span className={`flex-1 truncate text-[13px] ${fill === "win" ? "font-bold" : fill === "out" ? "font-medium text-muted line-through decoration-rose/40" : "font-medium text-ink-soft"}`}>
            {team.n}
          </span>
        </>
      ) : (
        <span className="flex-1 text-[13px] font-medium text-muted">—</span>
      )}
      {score != null && (
        <span className={`font-mono text-[13px] tabular-nums ${fill === "win" ? "font-extrabold text-green-deep" : "text-muted"}`}>{score}</span>
      )}
    </div>
  );
  const eggVideo = team ? eggMediaFor(team.n, opponent) : undefined;
  if (eggVideo) {
    return (
      <EasterEgg videoSrc={eggVideo} label={team!.n} className="block w-full cursor-pointer text-left">
        {row}
      </EasterEgg>
    );
  }
  return row;
}

function tonesFor(m: PoMatch, mode: Mode): { aFill: Fill; bFill: Fill } {
  const aWin = !!m.winner && m.a?.n === m.winner.n;
  const bWin = !!m.winner && m.b?.n === m.winner.n;
  if (mode === "participant") {
    if (m.state === "dead") return { aFill: "out", bFill: "out" };
    if (m.state === "exact" || m.state === "hit") return { aFill: aWin ? "win" : "out", bFill: bWin ? "win" : "out" };
    if (m.state === "alive") return { aFill: aWin ? "win" : "none", bFill: bWin ? "win" : "none" };
    return { aFill: "none", bFill: "none" };
  }
  if (!m.winner) return { aFill: "none", bFill: "none" };
  const loser: Fill = mode === "real" ? "out" : "none";
  return { aFill: aWin ? "win" : loser, bFill: bWin ? "win" : loser };
}

function PoMatchCard({ m, mode, gold }: { m: PoMatch; mode: Mode; gold?: boolean }) {
  const { aFill, bFill } = tonesFor(m, mode);
  const dead = mode === "participant" && m.state === "dead";
  const exact = mode === "participant" && m.state === "exact";
  return (
    <div className={`w-full overflow-hidden rounded-xl border ${gold ? "border-gold/50 bg-gradient-to-br from-gold-soft/45 to-gold/10 shadow-[0_10px_26px_-12px_rgba(224,152,15,0.55)] dark:from-gold-soft/20 dark:to-gold/5" : "glass-soft"} ${dead ? "ring-1 ring-black/5 dark:ring-white/10" : ""}`}>
      <TeamLine team={m.a} opponent={m.b?.n} score={m.scoreA} fill={aFill} />
      <div className="h-px bg-black/[0.06] dark:bg-white/10" />
      <TeamLine team={m.b} opponent={m.a?.n} score={m.scoreB} fill={bFill} />
      {mode === "real" && m.pens && (
        <div className="bg-black/[0.03] px-2 py-0.5 text-[10.5px] dark:bg-white/[0.05] font-semibold text-muted">по пен. · счёт ОТ</div>
      )}
      {mode === "majority" && m.votes != null && (
        <div className="flex items-center justify-between bg-black/[0.03] px-2 py-0.5 text-[10.5px] dark:bg-white/[0.05] font-semibold text-muted">
          <span className="truncate">{m.winner?.n}</span>
          <span className="shrink-0 text-green-deep">{m.votes}/{m.total}</span>
        </div>
      )}
      {mode === "participant" && m.state && (
        <div className="bg-black/[0.03] px-2 py-0.5 text-[10.5px] dark:bg-white/[0.05] font-bold">
          {exact && <span className="text-gold"><Target className="mr-0.5 inline size-3" strokeWidth={2.6} />точно</span>}
          {m.state === "hit" && <span className="text-green-deep">угадан проход</span>}
          {m.state === "alive" && <span className="text-green-deep"><Flame className="mr-0.5 inline size-3" strokeWidth={2.6} />в игре</span>}
          {m.state === "miss" && <span className="text-muted">мимо</span>}
          {dead && <span className="text-muted">сгорел</span>}
        </div>
      )}
    </div>
  );
}

function Header({ title, points, gold }: { title: string; points?: string; gold?: boolean }) {
  return (
    <div className="mb-2 flex h-6 items-center justify-between gap-1.5">
      <span className={`text-[10.5px] font-bold uppercase tracking-wide ${gold ? "text-gold" : "text-ink-soft"}`}>{title}</span>
      {points && (
        <span className={`chip px-1.5 py-0.5 text-[10.5px] ${gold ? "bg-gold/12 text-gold" : "bg-green/10 text-green-deep"}`}>{points}</span>
      )}
    </div>
  );
}

function RoundCol({ round, mode }: { round: PoRound; mode: Mode }) {
  return (
    <div className="flex flex-col" style={{ width: CARD_W }}>
      <Header title={round.title} points={POINTS[round.key]} />
      <div className="flex flex-1 flex-col">
        {round.matches.map((m, i) => (
          <div key={i} className="flex flex-1 items-center justify-center" style={{ minHeight: CELL_MIN }}>
            <PoMatchCard m={m} mode={mode} />
          </div>
        ))}
      </div>
    </div>
  );
}

// "]──" connector wires joining each pair of matches into the next round
function Connector({ cells }: { cells: number }) {
  return (
    <div className="flex flex-col" style={{ width: GAP }}>
      <div className="mb-2 h-6" />
      <div className="flex flex-1 flex-col">
        {Array.from({ length: cells }).map((_, i) => (
          <div key={i} className="relative flex-1">
            <span style={{ position: "absolute", left: 0, width: "50%", top: "25%", borderTop: `2px solid ${LINE}` }} />
            <span style={{ position: "absolute", left: 0, width: "50%", top: "75%", borderTop: `2px solid ${LINE}` }} />
            <span style={{ position: "absolute", left: "50%", top: "25%", height: "50%", borderLeft: `2px solid ${LINE}` }} />
            <span style={{ position: "absolute", left: "50%", right: 0, top: "50%", borderTop: `2px solid ${LINE}` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function BronzeNode({ third, mode }: { third: PoMatch; mode: Mode }) {
  const t = tonesFor(third, mode);
  const decided = third.winner && (third.scoreA != null || mode !== "real");
  return (
    <div className="w-full rounded-xl border border-black/5 bg-white/55 p-2 dark:border-white/10 dark:bg-white/8">
      <div className="mb-1 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide" style={{ color: "#cd7f48" }}>
        <Medal className="size-3.5" strokeWidth={2.4} />
        За 3-е место
      </div>
      {third.a && third.b ? (
        <>
          <TeamLine team={third.a} opponent={third.b?.n} score={third.scoreA} fill={t.aFill} />
          <TeamLine team={third.b} opponent={third.a?.n} score={third.scoreB} fill={t.bFill} />
          {!decided && <div className="px-2 pt-0.5 text-[10.5px] text-muted">{mode === "real" ? "ещё впереди" : "прогноз"}</div>}
        </>
      ) : (
        <div className="px-2 py-1 text-[10.5px] text-muted">Сыграют проигравшие в 1/2.</div>
      )}
    </div>
  );
}

export function PlayoffBracket({
  rounds, champion, mode, championStatus, third,
}: {
  rounds: PoRound[];
  champion: PoTeam;
  mode: Mode;
  championStatus?: string;
  third?: PoMatch;
}) {
  const mainRounds = rounds.filter((r) => r.key !== "f");
  const finalMatch = rounds.find((r) => r.key === "f")?.matches[0];

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max items-stretch">
        {mainRounds.map((round, idx) => {
          const nextCount = idx < mainRounds.length - 1 ? mainRounds[idx + 1].matches.length : 1;
          return (
            <div key={round.key} className="flex">
              <RoundCol round={round} mode={mode} />
              <Connector cells={nextCount} />
            </div>
          );
        })}

        {/* final · champion · bronze — vertically centred */}
        <div className="flex flex-col" style={{ width: FINAL_W }}>
          <Header title="Финал" points={POINTS.f} gold />
          <div className="flex flex-1 flex-col items-center justify-center gap-2.5">
            {finalMatch && <PoMatchCard m={finalMatch} mode={mode} gold />}
            <div className="flex w-full items-center gap-2.5 rounded-xl border border-gold/40 bg-gradient-to-br from-gold-soft/40 to-gold/5 p-2.5">
              <Trophy className="size-6 shrink-0 text-gold" strokeWidth={2} fill="#f6c453" />
              {champion ? (
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Flag code={champion.f} name={champion.n} w={18} />
                    <span className="truncate font-display text-[14px] font-extrabold">{champion.n}</span>
                  </div>
                  {championStatus && <div className="text-[10.5px] font-semibold text-muted">{championStatus}</div>}
                </div>
              ) : (
                <div className="text-[11.5px] font-bold text-ink-soft">Кубок ещё ждёт</div>
              )}
            </div>
            {third && <BronzeNode third={third} mode={mode} />}
          </div>
        </div>
      </div>
    </div>
  );
}
