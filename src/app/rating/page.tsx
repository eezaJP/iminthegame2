import { RatingHero } from "@/components/RatingHero";
import { RatingTable } from "@/components/RatingTable";
import { DayMovement } from "@/components/DayMovement";
import { OvertakeScenarios } from "@/components/OvertakeScenarios";
import { BestByCategory } from "@/components/BestByCategory";
import { ParticipantsStrip } from "@/components/ParticipantsStrip";
import { SiteFooter } from "@/components/SiteFooter";
import { getHomeData } from "@/lib/realData";

export const metadata = { title: "Рейтинг · I'm in the game" };
export const revalidate = 60;

function SectionHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-3 mt-10">
      <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-green-deep">{kicker}</div>
      <h2 className="font-display text-[22px] font-extrabold leading-tight sm:text-[26px]">{title}</h2>
    </div>
  );
}

export default async function RatingPage() {
  const data = await getHomeData();
  const r = data.rating;

  return (
    <div className="mt-3">
      <RatingHero
        phase={r.phase}
        matchesLeft={r.matchesLeft}
        seasonPotential={r.seasonPotential}
        roundLabel={r.roundLabel}
        koMatchesLeft={r.koMatchesLeft}
        playoffPotential={r.playoffPotential}
      />

      {/* standings + side panels */}
      <div className="mt-6 grid items-start gap-3 lg:grid-cols-[1.7fr_1fr]">
        <div id="full-rating" className="scroll-mt-24">
          <RatingTable players={data.players} movement={r.movement} />
        </div>
        <div className="flex flex-col gap-3">
          <DayMovement
            movers={r.dayMovers}
            emptyText={r.phase === "playoff" ? "Движение появится после первых матчей плей-офф." : undefined}
          />
          <OvertakeScenarios
            scenarios={r.overtakeScenarios}
            emptyText={r.phase === "playoff" ? "В плей-офф очки кратно дороже — обойти можно почти любого. Конкретные сценарии появятся, когда пойдут матчи на вылет." : undefined}
            linkHref={r.phase === "playoff" ? "/playoff" : "/groups"}
            linkLabel={r.phase === "playoff" ? "Сетка плей-офф" : "Все матчи дня"}
          />
        </div>
      </div>

      {/* best by category — rating-specific stories (distinct from home) */}
      <SectionHeader kicker="Лидеры сезона" title="Лучшие по категориям" />
      <BestByCategory cards={r.bestByCategory} />

      {/* participants strip */}
      <div className="mt-10">
        <ParticipantsStrip potentials={r.potentials} />
      </div>

      <SiteFooter />
    </div>
  );
}
