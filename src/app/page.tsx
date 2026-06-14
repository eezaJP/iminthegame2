import { Hero } from "@/components/Hero";
import { TodayInGame } from "@/components/TodayInGame";
import { Leaderboard } from "@/components/Leaderboard";
import { FunFacts } from "@/components/FunFacts";
import { LeagueStories } from "@/components/LeagueStories";
import { HostMap } from "@/components/HostMap";
import { Reveal } from "@/components/Reveal";
import { getHomeData } from "@/lib/realData";

// Live data: re-fetch (sheet + API-Football) at most once per minute.
export const revalidate = 60;

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

export default async function DashboardPage() {
  const data = await getHomeData();

  return (
    <div>
      <Hero participants={data.participantsCount} stats={data.stats} nextMatches={data.nextMatches} />

      <SectionHeader kicker="Что сегодня важно" title="Сегодня в игре" />
      <TodayInGame matches={data.todayMatches} potentialTotal={data.potentialTotal} riser={data.riser} />

      <SectionHeader kicker="Турнирная таблица" title="Рейтинг лиги" />
      <Leaderboard participants={data.players} />

      <SectionHeader kicker="Герои лиги" title="Главные герои" />
      <FunFacts awards={data.awards} />

      <SectionHeader kicker="Истории турнира" title="Прикольные факты" />
      <LeagueStories facts={data.facts} />

      <SectionHeader kicker="География турнира" title="Где играют сегодня" />
      <Reveal>
        <HostMap fixtures={data.fixtures} />
      </Reveal>

      <footer className="mt-12 text-center text-[12px] text-muted">
        Время матчей — московское (МСК). Результаты обновляются автоматически по ходу турнира.
      </footer>
    </div>
  );
}
