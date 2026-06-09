import { PlayoffView } from "@/components/PlayoffView";
import {
  ChampionAlive, NextStakes, LiveBrackets, BurnedPredictions,
  RealityVsMajority, ChampionCard, BronzeMatch,
} from "@/components/PlayoffBlocks";
import { Reveal } from "@/components/Reveal";
import { isDemoMode } from "@/lib/data";

export const metadata = { title: "Плей-офф · I'm in the game" };

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
      {isDemoMode && (
        <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-semibold lowercase tracking-wide text-muted">
          demo
        </span>
      )}
    </div>
  );
}

export default function PlayoffPage() {
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
              прошёл дальше. Ниже — реальная сетка, прогноз большинства и сетки участников.
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

      <SectionHeader kicker="Главная интрига" title="У кого чемпион ещё жив?" />
      <ChampionAlive />

      <SectionHeader kicker="Ставки растут" title="Цена следующего матча" />
      <NextStakes />

      <SectionHeader kicker="Сетка до кубка" title="Сетка плей-офф" />
      <PlayoffView />

      <SectionHeader kicker="Бронзовый матч" title="Матч за 3-е место" />
      <BronzeMatch />

      <SectionHeader kicker="Кубок" title="Чемпион" />
      <ChampionCard />

      <SectionHeader kicker="Кто ещё в деле" title="Самые живые сетки" />
      <LiveBrackets />

      <SectionHeader kicker="Без паники" title="Что уже сгорело" />
      <BurnedPredictions />

      <SectionHeader kicker="Итог" title="Реальность против большинства" />
      <Reveal>
        <RealityVsMajority />
      </Reveal>

      <footer className="mt-12 text-center text-[12px] text-muted">
        Счёт плей-офф — по основному и дополнительному времени, без пенальти. Данные демонстрационные.
      </footer>
    </div>
  );
}
