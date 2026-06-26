import { TrendingUp } from "lucide-react";
import { Avatar } from "./Avatar";

type Climber = {
  id: number;
  name: string;
  avatarSeed: number;
  rank: number;
  potential: number;
  move: string;
  condition: string;
};

export function WhoCanClimb({ climbers }: { climbers: Climber[] }) {
  if (!climbers.length) {
    return (
      <div className="glass p-6 text-center text-[14px] text-muted">
        Сегодня подвижек в рейтинге не ожидается — открытых очков нет.
      </div>
    );
  }

  return (
    <ul className="glass divide-y divide-black/[0.06] overflow-hidden p-1 dark:divide-white/[0.07]">
      {/* desktop column header */}
      <li className="hidden grid-cols-[44px_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.3fr)_36px] gap-4 px-4 pb-2 pt-2 md:grid">
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted">Место</span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted">Участник</span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted">Может</span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted">Условие</span>
        <span />
      </li>

      {climbers.map((c) => (
        <li key={c.id} className="px-3 py-3 transition-colors hover:bg-white/45 dark:hover:bg-white/[0.05] sm:px-4">
          {/* desktop row */}
          <div className="hidden items-center gap-4 md:grid md:grid-cols-[44px_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.3fr)_36px]">
            <span className="grid size-7 place-items-center rounded-full bg-black/[0.05] font-mono text-[12px] font-bold tabular-nums text-ink-soft dark:bg-white/[0.07]">
              {c.rank}
            </span>
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar name={c.name} seed={c.avatarSeed} size={34} />
              <span className="truncate text-[14px] font-bold">{c.name}</span>
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-bold first-letter:uppercase">{c.move}</div>
              <div className="text-[12px] font-bold tabular-nums text-green-deep">+{c.potential} очков</div>
            </div>
            <div className="text-[12.5px] leading-snug text-ink-soft">{c.condition || "если угадает сегодняшние матчи"}</div>
            <span className="grid size-9 place-items-center justify-self-end rounded-xl bg-green/10 text-green-deep">
              <TrendingUp className="size-4" strokeWidth={2.4} />
            </span>
          </div>

          {/* mobile card */}
          <div className="md:hidden">
            <div className="flex items-center gap-2.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-black/[0.05] font-mono text-[12px] font-bold tabular-nums text-ink-soft dark:bg-white/[0.07]">
                {c.rank}
              </span>
              <Avatar name={c.name} seed={c.avatarSeed} size={34} />
              <span className="min-w-0 flex-1 truncate text-[14px] font-bold">{c.name}</span>
              <span className="shrink-0 rounded-full bg-green/10 px-2.5 py-1 text-[11px] font-bold tabular-nums text-green-deep">
                +{c.potential}
              </span>
            </div>
            <div className="mt-2 pl-[42px]">
              <div className="text-[13px] font-bold first-letter:uppercase">{c.move}</div>
              <div className="mt-0.5 text-[12.5px] leading-snug text-ink-soft">
                {c.condition || "если угадает сегодняшние матчи"}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
