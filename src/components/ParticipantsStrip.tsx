import Image from "next/image";
import { ArrowRight, Users } from "lucide-react";
import { flagUrl } from "@/lib/utils";
import { Avatar } from "./Avatar";

type P = {
  id: number;
  name: string;
  avatarSeed: number;
  rank: number;
  total: number;
  champion: string;
  championFlag: string;
  max: number;
};

const RANK_TONE = ["bg-gold/15 text-gold", "bg-black/[0.06] text-ink-soft dark:bg-white/10", "bg-[#cf8b4d]/15 text-[#cf8b4d]"];

export function ParticipantsStrip({ potentials }: { potentials: P[] }) {
  const shown = potentials.slice(0, 5);
  const rest = potentials.length - shown.length;

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="font-display text-[22px] font-extrabold leading-tight sm:text-[26px]">Участники</h2>
        <a href="#full-rating" className="inline-flex items-center gap-1 text-[13px] font-semibold text-green-deep transition-colors hover:text-green">
          Все участники
          <ArrowRight className="size-3.5" strokeWidth={2.6} />
        </a>
      </div>

      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
        {shown.map((p) => (
          <div key={p.id} className="glass glass-hover w-[200px] shrink-0 snap-start p-4">
            <div className="flex items-center justify-between">
              <Avatar name={p.name} seed={p.avatarSeed} size={42} />
              <span className={`grid size-6 place-items-center rounded-full text-[11px] font-extrabold ${RANK_TONE[p.rank - 1] ?? "bg-black/[0.06] text-ink-soft dark:bg-white/10"}`}>
                {p.rank}
              </span>
            </div>
            <div className="mt-2.5 truncate text-[15px] font-bold">{p.name}</div>
            <div className="text-[12px] font-semibold tabular-nums text-muted">{p.total} очков</div>
            {p.champion && (
              <div className="mt-2 flex items-center gap-1.5">
                {p.championFlag && (
                  <Image src={flagUrl(p.championFlag, 40)} alt="" width={16} height={11} className="h-[11px] w-4 rounded-[2px] object-cover" unoptimized />
                )}
                <span className="truncate text-[12px] font-semibold text-ink-soft">{p.champion}</span>
              </div>
            )}
            <div className="mt-3 rounded-xl bg-white/55 px-2.5 py-2 text-[11px] font-medium leading-snug text-ink-soft ring-1 ring-black/5 dark:bg-white/8 dark:ring-white/12">
              Потенциал до <span className="font-bold tabular-nums text-gold">{p.max}</span> очков
            </div>
          </div>
        ))}

        {rest > 0 && (
          <a
            href="#full-rating"
            className="glass glass-hover flex w-[170px] shrink-0 snap-start flex-col items-center justify-center gap-2 p-4 text-center"
          >
            <span className="grid size-11 place-items-center rounded-2xl bg-white/70 text-green-deep ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
              <Users className="size-5" strokeWidth={2.3} />
            </span>
            <div className="font-display text-[18px] font-extrabold tabular-nums">+{rest}</div>
            <div className="text-[12px] font-semibold leading-snug text-muted">участников · смотри полный рейтинг</div>
          </a>
        )}
      </div>
    </div>
  );
}
