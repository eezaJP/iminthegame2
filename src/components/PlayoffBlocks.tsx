import { Trophy } from "lucide-react";
import type { ChampionAliveItem } from "@/lib/playoff";
import { Flag } from "./Flag";
import { EasterEgg } from "./EasterEgg";

// hidden easter-egg: tapping this eliminated champion pick opens a short video
const EGG_TEAM = "Бразилия";
const EGG_VIDEO = "/brazil-out.mp4";

/* ───────── Кого лига видит чемпионом (распределение прогнозов) ───────── */
export function ChampionAlive({ items }: { items: ChampionAliveItem[] }) {
  if (!items.length) {
    return <div className="glass p-5 text-center text-[13px] text-muted">Прогнозы на чемпиона появятся, как только участники заполнят сетки.</div>;
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c) => {
        const inner = (
          <>
            <div className="flex items-center gap-2.5">
              <Flag code={c.flag} name={c.team} w={26} />
              <span className={`font-display text-[15px] font-extrabold ${c.alive ? "" : "text-muted line-through decoration-rose/50"}`}>{c.team}</span>
              <span
                className={`chip ml-auto px-2 py-0.5 text-[10.5px] ${
                  c.alive ? "bg-green/12 text-green-deep" : "bg-rose/15 text-rose"
                }`}
              >
                {c.status}
              </span>
            </div>
            <div className="mt-1.5 text-[12px] font-semibold text-ink-soft">
              {c.count} {c.count === 1 ? "голос" : c.count < 5 ? "голоса" : "голосов"}
            </div>
            <div className="mt-1 text-[11.5px] leading-snug text-muted">{c.participants.join(", ")}</div>
          </>
        );
        if (c.team === EGG_TEAM) {
          return (
            <EasterEgg
              key={c.team}
              videoSrc={EGG_VIDEO}
              label={`${c.team} вылетела`}
              className="glass block w-full cursor-pointer p-4 text-left ring-1 ring-rose/25 transition-transform active:scale-[0.98]"
            >
              {inner}
            </EasterEgg>
          );
        }
        return (
          <div key={c.team} className={`glass p-4 ${c.alive ? "" : "ring-1 ring-rose/25"}`}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

/* ───────── Финальная карточка чемпиона ───────── */
export function ChampionCard({ favourite, total }: { favourite: ChampionAliveItem | null; total: number }) {
  return (
    <div className="glass relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold-soft/40 to-transparent" />
      <div className="relative flex flex-wrap items-center gap-x-6 gap-y-3">
        <Trophy className="size-10 text-gold" strokeWidth={1.8} fill="#f6c453" />
        <div>
          <div className="font-display text-xl font-extrabold">Кубок ещё ждёт победителя</div>
          <div className="mt-1 text-[13px] text-ink-soft">
            Чемпион определится в плей-офф — а пока прогнозы зафиксированы.
          </div>
          {favourite && (
            <div className="mt-1 text-[13px] text-muted">
              Фаворит лиги — <b className="text-ink">{favourite.team}</b> ({favourite.count} из {total} верят в него до старта).
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
