import { GroupCard } from "@/components/GroupCard";
import { GroupStageNav } from "@/components/GroupStageNav";
import { TodayInGame } from "@/components/TodayInGame";
import { GroupInsightCards } from "@/components/GroupInsightCards";
import { ThirdPlaceRace } from "@/components/ThirdPlaceRace";
import { Reveal } from "@/components/Reveal";
import {
  tournament, demo, matchesByGroup, playedCount, isDemoMode,
  intrigueGroups, almostDecidedGroups, thirdPlaceRace,
} from "@/lib/data";

export const metadata = { title: "Групповой этап · I'm in the game" };

function SectionHeader({ id, kicker, title }: { id: string; kicker: string; title: string }) {
  return (
    <div id={id} className="mb-3 mt-10 flex scroll-mt-36 items-end justify-between gap-3">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-green-deep">{kicker}</div>
        <h2 className="font-display text-[22px] font-extrabold leading-tight sm:text-[26px]">{title}</h2>
      </div>
      {isDemoMode && (
        <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-semibold lowercase tracking-wide text-muted dark:bg-white/[0.07]">
          demo
        </span>
      )}
    </div>
  );
}

export default function GroupsPage() {
  const groups = tournament.groups;
  const played = playedCount();
  const todayCount = demo.today.matches.length;
  const intrigue = intrigueGroups();
  const decided = almostDecidedGroups();
  const thirds = thirdPlaceRace();

  const summary = [
    { value: String(played), label: "сыграно" },
    { value: String(72 - played), label: "осталось" },
    { value: String(todayCount), label: "сегодня" },
    { value: String(intrigue.length), label: "с интригой" },
  ];

  return (
    <div className="mt-4">
      {/* top summary */}
      <div className="glass px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-green-deep">Этап 1 из 2</div>
            <h1 className="font-display text-[28px] font-extrabold leading-tight sm:text-[34px]">Групповой этап</h1>
            <p className="mt-1.5 text-[13px] leading-snug text-ink-soft">
              2 лучшие команды из каждой группы выходят напрямую, плюс 8 лучших третьих мест.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px]">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded bg-green/70" /> зелёная зона — прямой выход
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded bg-gold/70" /> золотая — борьба за 3-е место
              </span>
            </div>
          </div>
          <div className="flex gap-5">
            {summary.map((s) => (
              <div key={s.label}>
                <div className="font-display text-2xl font-extrabold tabular-nums">{s.value}</div>
                <div className="text-[11px] text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <GroupStageNav groups={groups.map((g) => g.letter)} />
      </div>

      <SectionHeader id="today" kicker="Что сегодня важно" title="Матчи сегодня" />
      <TodayInGame
        matches={demo.today.matches}
        potentialTotal={demo.today.potentialTotal}
        emptyText="Сегодня матчей нет. Следующий игровой день — скоро."
      />

      <SectionHeader id="intrigue" kicker="Главные интриги" title="Где ещё всё открыто" />
      <GroupInsightCards items={intrigue} variant="open" />

      <SectionHeader id="decided" kicker="Расклад" title="Почти решено" />
      <GroupInsightCards items={decided} variant="decided" />

      <SectionHeader id="thirds" kicker="Битва за плей-офф" title="Гонка третьих мест" />
      <Reveal>
        <ThirdPlaceRace rows={thirds} />
      </Reveal>

      <SectionHeader id="all" kicker="Полная картина" title="Все группы" />
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((g, i) => (
          <Reveal key={g.letter} delay={(i % 3) * 0.05}>
            <GroupCard letter={g.letter} matches={matchesByGroup(g.letter)} />
          </Reveal>
        ))}
      </div>

      <footer className="mt-12 text-center text-[12px] text-muted">
        Время матчей — московское (МСК). Данные демонстрационные — подключим Google-таблицу и API.
      </footer>
    </div>
  );
}
