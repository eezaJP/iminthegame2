import { SummaryBar } from "@/components/SummaryBar";
import { MainStory } from "@/components/MainStory";
import { TopParticipants } from "@/components/TopParticipants";
import { TodayMatches } from "@/components/TodayMatches";
import { WhoCanClimb } from "@/components/WhoCanClimb";
import { StoriesOfDay } from "@/components/StoriesOfDay";
import { FixedBanner } from "@/components/FixedBanner";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { getHomeData } from "@/lib/realData";
import { ruDate } from "@/lib/utils";

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
      <SummaryBar friends={data.participantsCount} played={data.playedTotal} total={72} stats={data.stats} />

      {/* hero row: main story + short leaderboard */}
      <div className="mt-3 grid gap-3 lg:grid-cols-[1.7fr_1fr]">
        <MainStory story={data.mainStory} nextMatches={data.nextMatches} />
        <Reveal delay={0.1}>
          <TopParticipants players={data.players} />
        </Reveal>
      </div>

      {/* today's matches */}
      <section id="today" className="mt-10 scroll-mt-24">
        <TodayMatches
          matches={data.todayMatches}
          potentialTotal={data.potentialTotal}
          areToday={data.matchesAreToday}
          dayLabel={ruDate(data.spotlightDay)}
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
