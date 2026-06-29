import { SummaryBar } from "@/components/SummaryBar";
import { MainStory } from "@/components/MainStory";
import { GroupRace } from "@/components/GroupRace";
import { TodayMatches } from "@/components/TodayMatches";
import { WhoCanClimb } from "@/components/WhoCanClimb";
import { StoriesOfDay } from "@/components/StoriesOfDay";
import { FixedBanner } from "@/components/FixedBanner";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { getHomeData } from "@/lib/realData";

// Live data: re-fetch (sheet + API-Football) at most once per minute.
export const revalidate = 60;

function SectionHeader({ id, kicker, title }: { id?: string; kicker: string; title: string }) {
  return (
    <div id={id} className="mb-3 mt-10 flex scroll-mt-24 items-end justify-between gap-3">
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
    <div className="mt-3">
      <SummaryBar friends={data.participantsCount} played={data.totalPlayed} total={data.totalMatches} stats={data.stats} />

      {/* main story of the day — full width */}
      <div className="mt-3">
        <MainStory story={data.mainStory} nextMatches={data.nextMatches} />
      </div>

      {/* LIVE points race — before the knockout matches */}
      {data.race && (
        <section className="mt-6">
          <Reveal>
            <GroupRace days={data.race.days} rows={data.race.rows} />
          </Reveal>
        </section>
      )}

      {/* today's matches */}
      <section id="today" className="mt-10 scroll-mt-24">
        <TodayMatches
          matches={data.homeMatches}
          potentialTotal={data.potentialTotal}
          areToday
          dayLabel=""
          title={data.homeMatchesTitle}
          allHref={data.homeMatchesHref}
          total={data.participantsCount}
        />
      </section>

      {/* who can climb today */}
      {data.climbers.length > 0 && (
        <>
          <SectionHeader kicker="Движение в рейтинге" title="Кто может подняться сегодня" />
          <WhoCanClimb climbers={data.climbers} />
        </>
      )}

      {/* stories of the day */}
      {data.stories.length > 0 && (
        <>
          <SectionHeader kicker="Что происходит в лиге" title="Истории дня" />
          <StoriesOfDay stories={data.stories} />
        </>
      )}

      <FixedBanner />
      <SiteFooter />
    </div>
  );
}
