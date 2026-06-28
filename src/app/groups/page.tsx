import { GroupCard } from "@/components/GroupCard";
import { GroupStageNav } from "@/components/GroupStageNav";
import { TodayInGame } from "@/components/TodayInGame";
import { GroupInsightCards } from "@/components/GroupInsightCards";
import { ThirdPlaceRace } from "@/components/ThirdPlaceRace";
import { Reveal } from "@/components/Reveal";
import { getGroupsData } from "@/lib/realData";

export const metadata = { title: "Групповой этап · I'm in the game" };
export const revalidate = 60;

function SectionHeader({ id, kicker, title }: { id: string; kicker: string; title: string }) {
  return (
    <div id={id} className="mb-3 mt-10 flex scroll-mt-36 items-end justify-between gap-3">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-green-deep">{kicker}</div>
        <h2 className="font-display text-[22px] font-extrabold leading-tight sm:text-[26px]">{title}</h2>
      </div>
    </div>
  );
}

const ARCHIVE_SECTIONS = [
  { id: "thirds", label: "Третьи места" },
  { id: "all", label: "Все группы" },
];

export default async function GroupsPage() {
  const data = await getGroupsData();
  const done = data.done;

  return (
    <div className="mt-4">
      {/* top summary */}
      <div className="glass px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-green-deep">
              {done ? "Этап 1 из 2 · завершён" : "Этап 1 из 2"}
            </div>
            <h1 className="font-display text-[28px] font-extrabold leading-tight sm:text-[34px]">Групповой этап</h1>
            <p className="mt-1.5 text-[13px] leading-snug text-ink-soft">
              {done
                ? "Все 72 матча сыграны. В плей-офф вышли 24 команды напрямую плюс 8 лучших третьих мест."
                : "2 лучшие команды из каждой группы выходят напрямую, плюс 8 лучших третьих мест."}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px]">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded bg-green/70" /> зелёная зона — прямой выход
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded bg-gold/70" /> золотая — {done ? "прошли с 3-го места" : "борьба за 3-е место"}
              </span>
            </div>
          </div>
          <div className="flex gap-5">
            {data.summary.map((s) => (
              <div key={s.label}>
                <div className="font-display text-2xl font-extrabold tabular-nums">{s.value}</div>
                <div className="text-[11px] text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <GroupStageNav groups={data.cards.map((c) => c.letter)} sections={done ? ARCHIVE_SECTIONS : undefined} />
      </div>

      {!done && (
        <>
          <SectionHeader id="today" kicker="Что сегодня важно" title="Матчи сегодня" />
          <TodayInGame
            matches={data.todayMatches}
            potentialTotal={data.potentialTotal}
            emptyText="Сегодня матчей нет. Следующий игровой день — скоро."
          />

          <SectionHeader id="intrigue" kicker="Главные интриги" title="Где ещё всё открыто" />
          <GroupInsightCards items={data.intrigue} variant="open" />

          <SectionHeader id="decided" kicker="Расклад" title="Почти решено" />
          <GroupInsightCards items={data.decided} variant="decided" />
        </>
      )}

      <SectionHeader id="thirds" kicker="Битва за плей-офф" title={done ? "Кто прошёл с 3-х мест" : "Гонка третьих мест"} />
      <Reveal>
        <ThirdPlaceRace rows={data.thirds} done={done} />
      </Reveal>

      <SectionHeader id="all" kicker="Полная картина" title="Все группы" />
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {data.cards.map((c, i) => (
          <Reveal key={c.letter} delay={(i % 3) * 0.05}>
            <GroupCard letter={c.letter} table={c.table} status={c.status} matchdays={c.matchdays} summary={c.summary} />
          </Reveal>
        ))}
      </div>

      <footer className="mt-12 text-center text-[12px] text-muted">
        Время матчей — московское (МСК). Результаты обновляются автоматически по ходу турнира.
      </footer>
    </div>
  );
}
