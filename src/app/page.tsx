import { Hero } from "@/components/Hero";
import { TodayInGame } from "@/components/TodayInGame";
import { Leaderboard } from "@/components/Leaderboard";
import { FunFacts } from "@/components/FunFacts";
import { LeagueStories } from "@/components/LeagueStories";
import { HostMap } from "@/components/HostMap";
import { Reveal } from "@/components/Reveal";
import { tournament, demo, standings, isDemoMode } from "@/lib/data";

function SectionHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-3 mt-10 flex scroll-mt-24 items-end justify-between gap-3">
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

export default function DashboardPage() {
  const players = standings();
  const todaySlim = demo.today.matches.map((m) => ({
    time: m.time, home: m.home, away: m.away, homeFlag: m.homeFlag, awayFlag: m.awayFlag,
  }));
  const slimFixtures = tournament.matches.map((m) => ({
    cityId: m.cityId, date: m.date, time: m.time, group: m.group,
    home: m.home, away: m.away, homeFlag: m.homeFlag, awayFlag: m.awayFlag,
  }));
  const stats = [
    { value: "72", label: "матча в группах" },
    { value: "48", label: "команд" },
    { value: "16", label: "городов" },
    { value: "12", label: "групп" },
  ];

  return (
    <div>
      <Hero participants={tournament.meta.participants} stats={stats} todayMatches={todaySlim} />

      {/* live intrigue first */}
      <SectionHeader kicker="Что сегодня важно" title="Сегодня в игре" />
      <TodayInGame
        matches={demo.today.matches}
        potentialTotal={demo.today.potentialTotal}
        riser={demo.facts.threat}
      />

      <SectionHeader kicker="Турнирная таблица" title="Рейтинг лиги" />
      <Leaderboard participants={players} />

      <SectionHeader kicker="Герои лиги" title="Главные герои" />
      <FunFacts awards={demo.awards} />

      <SectionHeader kicker="Истории турнира" title="Прикольные факты" />
      <LeagueStories facts={demo.facts} />

      <SectionHeader kicker="География турнира" title="Где играют сегодня" />
      <Reveal>
        <HostMap fixtures={slimFixtures} />
      </Reveal>

      <footer className="mt-12 text-center text-[12px] text-muted">
        Время матчей — московское (МСК). Данные демонстрационные — лига оживёт по-настоящему,
        как только подключим Google-таблицу и результаты по API.
      </footer>
    </div>
  );
}
