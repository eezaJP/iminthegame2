import { ArrowUp, ArrowDown, Minus, TrendingUp, ArrowRight } from "lucide-react";
import { Avatar } from "./Avatar";

type Mover = { id: number; name: string; avatarSeed: number; prevRank: number; nowRank: number; delta: number };

function Badge({ delta }: { delta: number }) {
  if (delta > 0)
    return (
      <span className="inline-flex items-center gap-0.5 rounded-md bg-green/12 px-1.5 py-0.5 text-[11px] font-bold text-green-deep">
        <ArrowUp className="size-3" strokeWidth={3} />{delta}
      </span>
    );
  if (delta < 0)
    return (
      <span className="inline-flex items-center gap-0.5 rounded-md bg-rose/12 px-1.5 py-0.5 text-[11px] font-bold text-rose">
        <ArrowDown className="size-3" strokeWidth={3} />{Math.abs(delta)}
      </span>
    );
  return <Minus className="size-4 text-muted" strokeWidth={2.6} />;
}

export function DayMovement({ movers }: { movers: Mover[] }) {
  const hasMovement = movers.some((m) => m.delta !== 0);

  return (
    <section className="glass p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-lg bg-white/70 text-green-deep ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
          <TrendingUp className="size-4" strokeWidth={2.4} />
        </span>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Движение за день</h2>
      </div>

      {hasMovement ? (
        <ul className="mt-3 divide-y divide-black/[0.06] dark:divide-white/[0.07]">
          {movers.map((m) => (
            <li key={m.id} className="flex items-center gap-2.5 py-2.5">
              <Avatar name={m.name} seed={m.avatarSeed} size={32} />
              <span className="min-w-0 flex-1 truncate text-[14px] font-bold">{m.name}</span>
              <span className="font-mono text-[12px] font-semibold tabular-nums text-muted">
                {m.prevRank} <span className="text-ink/40">→</span> {m.nowRank}
              </span>
              <Badge delta={m.delta} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[13px] leading-snug text-muted">
          Сегодня рейтинг ещё не двигался — появится после сыгранных матчей дня.
        </p>
      )}

      <a
        href="#full-rating"
        className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-green-deep transition-colors hover:text-green"
      >
        Смотреть полную таблицу
        <ArrowRight className="size-3.5" strokeWidth={2.6} />
      </a>
    </section>
  );
}
