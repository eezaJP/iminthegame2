import Link from "next/link";
import { ArrowRight, Crown } from "lucide-react";
import type { Participant } from "@/lib/types";
import { Avatar } from "./Avatar";

/** Short top-5 standings for the home dashboard. Full table lives on /rating. */
export function TopParticipants({ players }: { players: Participant[] }) {
  const top = players.slice(0, 5);
  const leaderTotal = players[0]?.points.total ?? 0;

  return (
    <section className="glass flex flex-col p-4 sm:p-5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Топ участников</h2>
        <Link
          href="/rating"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-green-deep transition-colors hover:text-green"
        >
          Весь рейтинг
          <ArrowRight className="size-3.5" strokeWidth={2.6} />
        </Link>
      </div>

      <ul className="-mx-1 divide-y divide-black/[0.06] dark:divide-white/[0.07]">
        {top.map((p) => {
          const gap = leaderTotal - p.points.total;
          const isLeader = p.rank === 1;
          return (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl px-1 py-2.5">
              <span className="w-5 text-center font-mono text-[13px] font-bold tabular-nums text-muted">{p.rank}</span>
              <div className="relative shrink-0">
                <Avatar name={p.name} seed={p.avatarSeed} size={36} />
                {isLeader && (
                  <Crown className="absolute -right-1 -top-2 size-4 text-gold drop-shadow" strokeWidth={2.2} fill="#f6c453" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-bold leading-tight">{p.name}</div>
                <div className="text-[12px] font-semibold tabular-nums text-muted">
                  {p.points.total} очков
                </div>
              </div>
              {isLeader ? (
                <span className="rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-bold text-gold">Лидер</span>
              ) : (
                <span className="rounded-full bg-rose/12 px-2.5 py-1 text-[11px] font-bold tabular-nums text-rose">
                  −{gap}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
