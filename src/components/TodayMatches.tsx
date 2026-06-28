import Link from "next/link";
import { Flame, BarChart3, Info, ArrowRight } from "lucide-react";
import type { TodayMatch } from "@/lib/types";
import { ruWeekday, ruDate } from "@/lib/utils";
import { Flag } from "./Flag";

/** "ПН, 29 июня" from an MSK date string (YYYY-MM-DD). */
function whenLabel(date?: string): string {
  if (!date) return "";
  return `${ruWeekday(date).toUpperCase()}, ${ruDate(date)}`;
}

function majority(m: TodayMatch): string {
  const { home, draw, away } = m.dist;
  if (home === 0 && draw === 0 && away === 0) return "—";
  if (home > away && home >= draw) return m.home;
  if (away > home && away >= draw) return m.away;
  if (draw >= home && draw >= away) return "Ничья";
  return "—";
}

function Score({ m }: { m: TodayMatch }) {
  const played = m.status !== "upcoming" && m.gh !== null && m.ga !== null;
  if (played) {
    return (
      <span className="rounded-lg bg-[#0a7d55] px-2.5 py-1 font-mono text-[14px] font-extrabold tabular-nums text-white shadow-sm">
        {m.gh}:{m.ga}
      </span>
    );
  }
  return (
    <span className="rounded-lg bg-black/[0.05] px-2.5 py-1 font-mono text-[13px] font-bold tabular-nums text-muted dark:bg-white/[0.07]">
      {m.time}
    </span>
  );
}

function Teams({ m }: { m: TodayMatch }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex flex-1 items-center justify-end gap-1.5 truncate text-right text-[14px] font-bold">
        <span className="truncate">{m.home}</span>
        <Flag code={m.homeFlag} name={m.home} w={20} />
      </span>
      <Score m={m} />
      <span className="flex flex-1 items-center gap-1.5 truncate text-[14px] font-bold">
        <Flag code={m.awayFlag} name={m.away} w={20} />
        <span className="truncate">{m.away}</span>
      </span>
    </div>
  );
}

function GroupTime({ m }: { m: TodayMatch }) {
  return (
    <div className="flex flex-col gap-0.5">
      {m.date && <span className="text-[10px] font-bold tracking-wide text-muted">{whenLabel(m.date)}</span>}
      <span className="font-mono text-[14px] font-bold tabular-nums">{m.time}</span>
      {!m.isKnockout && <span className="text-[10px] font-semibold text-muted">Группа {m.group}</span>}
    </div>
  );
}

function Live({ status }: { status: TodayMatch["status"] }) {
  if (status === "live")
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-rose/12 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-rose">
        <span className="live-dot inline-block size-1.5 rounded-full bg-rose" />live
      </span>
    );
  if (status === "finished")
    return (
      <span className="rounded-md bg-black/[0.05] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted dark:bg-white/[0.07]">
        завершён
      </span>
    );
  return null;
}

function Row({ m }: { m: TodayMatch }) {
  const fav = majority(m);
  return (
    <li className="px-3 py-3 transition-colors hover:bg-white/45 dark:hover:bg-white/[0.05] sm:px-4">
      {/* desktop: single aligned row */}
      <div className="hidden items-center gap-4 md:grid md:grid-cols-[88px_minmax(0,1fr)_132px_104px_92px_36px]">
        <GroupTime m={m} />
        <Teams m={m} />
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted">{m.isKnockout ? "Лига ставит на" : "Большинство"}</div>
          <div className="truncate text-[13px] font-bold">{fav}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted">{m.isKnockout ? "Стадия" : "Частый счёт"}</div>
          {m.isKnockout ? (
            <span className="text-[12px] font-bold">{m.stage}</span>
          ) : (
            <span className="mt-0.5 inline-block rounded-md bg-ink px-1.5 py-0.5 font-mono text-[12px] font-bold text-bg">
              {m.popularScore}
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted">
            {m.status === "finished" ? "Итог" : m.isKnockout ? "За матч" : "В игре"}
          </div>
          {m.status === "finished" ? (
            <div className="text-[12px] font-semibold text-muted">сыгран</div>
          ) : (
            <div className="inline-flex items-center gap-1 text-[13px] font-bold text-gold">
              <Flame className="size-3.5" strokeWidth={2.6} />
              {m.potential}
            </div>
          )}
        </div>
        <Link
          href={m.isKnockout ? "/playoff" : `/groups#group-${m.group}`}
          aria-label={m.isKnockout ? "Сетка плей-офф" : "Детали группы"}
          className="grid size-9 place-items-center justify-self-end rounded-xl bg-white/60 text-ink-soft ring-1 ring-black/5 transition-colors hover:text-green-deep dark:bg-white/10 dark:ring-white/10"
        >
          <BarChart3 className="size-4" strokeWidth={2.2} />
        </Link>
      </div>

      {/* mobile: stacked card */}
      <div className="md:hidden">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-green/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-deep">
              {m.date ? `${whenLabel(m.date)} · ` : ""}{m.time}
            </span>
            <span className="text-[10px] font-semibold text-muted">{m.isKnockout ? m.stage : `Группа ${m.group}`}</span>
            <Live status={m.status} />
          </div>
          {m.status !== "finished" && (
            <span className="inline-flex items-center gap-1 text-[12px] font-bold text-gold">
              <Flame className="size-3.5" strokeWidth={2.6} />до {m.potential}
            </span>
          )}
        </div>
        <Teams m={m} />
        <div className="mt-2.5 flex items-center justify-between gap-2 text-[12px]">
          {m.isKnockout ? (
            <span className="text-muted">
              Лига ставит на <span className="font-bold text-ink">{fav}</span>
            </span>
          ) : (
            <>
              <span className="text-muted">
                Большинство: <span className="font-bold text-ink">{fav}</span>
              </span>
              <span className="text-muted">
                Счёт{" "}
                <span className="ml-0.5 rounded-md bg-ink px-1.5 py-0.5 font-mono text-[11px] font-bold text-bg">
                  {m.popularScore}
                </span>
              </span>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

export function TodayMatches({
  matches,
  potentialTotal,
  areToday,
  dayLabel,
  title,
  allHref = "/groups",
  emptyText = "Сегодня матчей нет — прогнозы зафиксированы, ждём следующий игровой день.",
}: {
  matches: TodayMatch[];
  potentialTotal: number;
  areToday: boolean;
  dayLabel: string;
  title?: string;
  allHref?: string | null;
  emptyText?: string;
}) {
  if (!matches.length) {
    return <div className="glass p-6 text-center text-[14px] text-muted">{emptyText}</div>;
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-[22px] font-extrabold leading-tight sm:text-[26px]">
            {title ?? (areToday ? "Матчи сегодня" : "Ближайшие матчи")}
          </h2>
          <span className="rounded-full bg-green/12 px-2.5 py-1 text-[11px] font-bold text-green-deep">
            {matches.length} {areToday ? "" : `· ${dayLabel}`}
          </span>
        </div>
        {allHref && (
          <Link
            href={allHref}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-green-deep transition-colors hover:text-green"
          >
            Все матчи
            <ArrowRight className="size-3.5" strokeWidth={2.6} />
          </Link>
        )}
      </div>

      <ul className="glass divide-y divide-black/[0.06] overflow-hidden p-1 dark:divide-white/[0.07]">
        {matches.map((m) => (
          <Row key={m.id} m={m} />
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/55 px-4 py-3 text-[12px] leading-snug text-ink-soft ring-1 ring-black/5 dark:bg-white/8 dark:ring-white/12">
        <span className="inline-flex items-center gap-2">
          <Info className="size-4 shrink-0 text-sky" strokeWidth={2.2} />
          Очки распределяются по точности прогноза: точный счёт, исход, разница мячей.
          {potentialTotal > 0 ? ` Сегодня в игре до ${potentialTotal} очков.` : ""}
        </span>
        <Link href="/rules" className="inline-flex shrink-0 items-center gap-1 font-semibold text-green-deep hover:text-green">
          Как начисляются очки
          <ArrowRight className="size-3.5" strokeWidth={2.6} />
        </Link>
      </div>
    </div>
  );
}
