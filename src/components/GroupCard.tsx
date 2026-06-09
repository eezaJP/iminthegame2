import type { Match } from "@/lib/types";
import { groupTable, groupStatus, groupSummary, predictionFor, demoToday } from "@/lib/data";
import { ruDate } from "@/lib/utils";
import { Flag } from "./Flag";

function ScorePill({ m }: { m: Match }) {
  if (m.goalsHome === null || m.goalsAway === null) {
    return (
      <span className="rounded-md bg-black/[0.04] px-2 py-0.5 font-mono text-[11px] font-semibold text-muted">
        {m.time}
      </span>
    );
  }
  return (
    <span className="rounded-md bg-ink px-2 py-0.5 font-mono text-[12px] font-bold tabular-nums text-white">
      {m.goalsHome}:{m.goalsAway}
    </span>
  );
}

function FixtureRow({ m }: { m: Match }) {
  const played = m.goalsHome !== null;
  const isToday = m.date === demoToday;
  const homeWin = played && m.goalsHome! > m.goalsAway!;
  const awayWin = played && m.goalsAway! > m.goalsHome!;
  const pred = !played ? predictionFor(m.id) : null;
  return (
    <div className="py-1.5">
      <div className="flex items-center gap-2 text-[12.5px]">
        <div className="flex flex-1 items-center justify-end gap-1.5 text-right">
          <span className={homeWin ? "font-bold" : "font-medium text-ink-soft"}>{m.home}</span>
          <Flag code={m.homeFlag} name={m.home} w={18} />
        </div>
        <ScorePill m={m} />
        <div className="flex flex-1 items-center gap-1.5">
          <Flag code={m.awayFlag} name={m.away} w={18} />
          <span className={awayWin ? "font-bold" : "font-medium text-ink-soft"}>{m.away}</span>
        </div>
      </div>
      {pred && (
        <div className="mt-1 flex items-center justify-center gap-2 text-[10.5px] text-muted">
          {isToday && (
            <span className="rounded-full bg-green/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-green-deep">
              сегодня
            </span>
          )}
          <span>прогноз {pred.home}·{pred.draw}·{pred.away}</span>
          <span className="text-ink/30">·</span>
          <span>счёт {pred.score}</span>
        </div>
      )}
    </div>
  );
}

const TONE: Record<string, string> = {
  live: "text-green-deep",
  done: "text-muted",
  progress: "text-muted",
  soon: "text-muted",
};

export function GroupCard({ letter, matches }: { letter: string; matches: Match[] }) {
  const table = groupTable(letter);
  const status = groupStatus(letter);
  const byMatchday = [1, 2, 3].map((md) => ({ md, list: matches.filter((m) => m.matchday === md) }));

  return (
    <div id={`group-${letter}`} className="glass glass-hover flex scroll-mt-32 flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-green to-green-deep font-display text-base font-extrabold text-white shadow-sm">
            {letter}
          </span>
          <div>
            <div className="font-display text-[15px] font-extrabold leading-none">Группа {letter}</div>
            <div className={`mt-1 flex items-center gap-1.5 text-[11px] font-semibold ${TONE[status.tone]}`}>
              {status.tone === "live" && <span className="live-dot inline-block size-1.5 rounded-full bg-green" />}
              {status.label}
            </div>
          </div>
        </div>
      </div>

      <table className="w-full border-separate border-spacing-y-1 text-[12.5px]">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-wide text-muted">
            <th className="w-5" />
            <th className="text-left font-bold">Команда</th>
            <th className="w-6 text-center font-bold">И</th>
            <th className="w-7 text-center font-bold">РМ</th>
            <th className="w-7 text-center font-bold">О</th>
          </tr>
        </thead>
        <tbody>
          {table.map((r, i) => {
            const zone = i < 2 ? "bg-green/10" : i === 2 ? "bg-gold/10" : "";
            return (
              <tr key={r.name} className={zone}>
                <td className="rounded-l-lg py-1 pl-1.5 text-center font-mono text-[11px] font-bold text-muted">{i + 1}</td>
                <td className="py-1">
                  <span className="flex items-center gap-1.5">
                    <Flag code={r.flag} name={r.name} w={18} />
                    <span className="truncate font-semibold">{r.name}</span>
                  </span>
                </td>
                <td className="text-center tabular-nums text-muted">{r.played}</td>
                <td className="text-center font-mono tabular-nums text-ink-soft">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                <td className="rounded-r-lg text-center font-display text-[13px] font-extrabold tabular-nums">{r.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-3 space-y-1 border-t border-black/5 pt-2">
        {byMatchday.map(({ md, list }) => (
          <div key={md}>
            <div className="mt-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-muted">
              <span>{md}-й тур</span>
              <span className="font-medium normal-case tracking-normal">· {ruDate(list[0].date)}</span>
              <span className="h-px flex-1 bg-black/5" />
            </div>
            {list.map((m) => (
              <FixtureRow key={m.id} m={m} />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-black/5 pt-2.5 text-[11.5px] leading-snug text-ink-soft">
        {groupSummary(letter)}
      </div>
    </div>
  );
}
