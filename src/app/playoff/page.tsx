import { PlayoffView } from "@/components/PlayoffView";
import { ChampionAlive, ChampionCard } from "@/components/PlayoffBlocks";
import { Hourglass } from "lucide-react";
import { getPlayoffData } from "@/lib/realData";

export const metadata = { title: "Плей-офф · I'm in the game" };
export const revalidate = 60;

const BONUS = [
  { stage: "1/8", v: "+2" },
  { stage: "1/4", v: "+3" },
  { stage: "1/2", v: "+5" },
  { stage: "Финал", v: "+8" },
];

function SectionHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-3 mt-10 flex scroll-mt-24 items-end justify-between gap-3">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-green-deep">{kicker}</div>
        <h2 className="font-display text-[22px] font-extrabold leading-tight sm:text-[26px]">{title}</h2>
      </div>
    </div>
  );
}

export default async function PlayoffPage() {
  const data = await getPlayoffData();

  return (
    <div className="mt-4">
      {/* intro */}
      <div className="glass px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-green-deep">Этап 2 из 2</div>
            <h1 className="font-display text-[28px] font-extrabold leading-tight sm:text-[34px]">Плей-офф</h1>
            <p className="mt-1.5 text-[13px] leading-snug text-ink-soft">
              Сетку каждый заполнял вслепую до старта — теперь прогнозы зафиксированы. Счёт считается
              по основному и дополнительному времени, пенальти не учитываются: победитель — тот, кто
              прошёл дальше.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Бонус за состав этапа</span>
            <div className="flex flex-wrap gap-2">
              {BONUS.map((b) => (
                <span key={b.stage} className="chip bg-sky/10 text-sky">{b.stage} {b.v}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!data.started && (
        <div className="glass mt-4 flex items-center gap-3 px-5 py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gold/12 text-gold">
            <Hourglass className="size-5" strokeWidth={2.2} />
          </span>
          <div className="text-[13px] leading-snug text-ink-soft">
            <b className="text-ink">Плей-офф ещё впереди.</b> Стадия на вылет начнётся после группового этапа.
            Реальная сетка, живые матчи и подсчёт очков появятся здесь автоматически — а пока показываем
            зафиксированные прогнозы участников.
          </div>
        </div>
      )}

      <SectionHeader kicker="Прогноз лиги" title="Кого лига видит чемпионом" />
      <ChampionAlive items={data.championAlive} />

      <SectionHeader kicker="Слепые сетки" title="Сетки участников" />
      <PlayoffView brackets={data.brackets} />

      <SectionHeader kicker="Кубок" title="Чемпион" />
      <ChampionCard favourite={data.favourite} total={data.brackets.length} />

      <footer className="mt-12 text-center text-[12px] text-muted">
        Счёт плей-офф — по основному и дополнительному времени, без пенальти. Данные обновляются автоматически.
      </footer>
    </div>
  );
}
