// Assembles the pool's scoring data WITHOUT the Google Sheet: locked predictions
// (baked in predictions.ts) + live actuals (API-Football fixtures + standings),
// run through the scoring engine. Returns the exact SheetData shape the rest of
// the app already consumes, so realData.ts / components are unchanged.
import { getFixtures, getStandings, type ApiFixture } from "./sources/apiFootball";
import { PARTICIPANTS } from "./predictions";
import { computeStandings, stageKey, type Actuals, type KoResult, type StageKey, type GroupStanding } from "./scoring";
import type { Score, SheetData, SheetParticipant, GroupResult } from "./sources/sheet";

const koWinner = (f: ApiFixture, home: string, away: string): string => {
  if (f.gh === null || f.ga === null) return "";
  if (f.gh > f.ga) return home;
  if (f.ga > f.gh) return away;
  if (f.penHome !== null && f.penAway !== null) return f.penHome > f.penAway ? home : away;
  return "";
};

const PREV_STAGE: Partial<Record<StageKey, StageKey>> = { r16: "r32", qf: "r16", sf: "qf", final: "sf" };

/** Build the live actuals (RU name space) from API fixtures + standings. */
export function buildActuals(fixtures: ApiFixture[], standings: { group: string; rank: number; teamRu: string | null; advanced: boolean }[]): Actuals {
  // group match results
  const groupResults = new Map<string, Score>();
  for (const f of fixtures) {
    if (f.roundKey !== "GROUP" || !f.finished || f.gh === null || f.ga === null || !f.homeRu || !f.awayRu) continue;
    groupResults.set(`${f.homeRu}|${f.awayRu}`, [f.gh, f.ga]);
  }

  // group standings (1st/2nd/3rd + 3rd advanced) from the official table
  const byGroup: Record<string, { rank: number; team: string; advanced: boolean }[]> = {};
  for (const s of standings) {
    if (!s.teamRu) continue;
    (byGroup[s.group] ??= []).push({ rank: s.rank, team: s.teamRu, advanced: s.advanced });
  }
  const groupStandings: Record<string, GroupStanding> = {};
  for (const [letter, rows] of Object.entries(byGroup)) {
    const r = [...rows].sort((a, b) => a.rank - b.rank);
    if (r.length < 3) continue;
    groupStandings[letter] = { first: r[0].team, second: r[1].team, third: r[2].team, thirdAdvanced: !!r[2].advanced };
  }

  // knockout results
  const koResults: KoResult[] = [];
  for (const f of fixtures) {
    const k = stageKey(f.roundKey);
    if (!k) continue;
    if (!f.finished || f.gh === null || f.ga === null || !f.homeRu || !f.awayRu) continue;
    const winner = koWinner(f, f.homeRu, f.awayRu);
    koResults.push({ stage: k, home: f.homeRu, away: f.awayRu, gh: f.gh, ga: f.ga, winner });
  }

  // teams that REACHED each stage = winners of the previous round
  const reachedStage = { r32: new Set<string>(), r16: new Set<string>(), qf: new Set<string>(), sf: new Set<string>(), third: new Set<string>(), final: new Set<string>() } as Record<StageKey, Set<string>>;
  for (const [stage, prev] of Object.entries(PREV_STAGE) as [StageKey, StageKey][]) {
    for (const r of koResults) if (r.stage === prev && r.winner) reachedStage[stage].add(r.winner);
  }

  // champion / finalist / 3rd place (when those matches are played)
  const finalMatch = koResults.find((r) => r.stage === "final");
  const thirdMatch = koResults.find((r) => r.stage === "third");
  const champion = finalMatch?.winner || null;
  const finalist = finalMatch ? (finalMatch.winner === finalMatch.home ? finalMatch.away : finalMatch.home) : null;
  const third = thirdMatch?.winner || null;

  return { groupResults, groupStandings, koResults, reachedStage, champion, finalist, third };
}

function buildResults(fixtures: ApiFixture[]): GroupResult[] {
  const out: GroupResult[] = [];
  for (const f of fixtures) {
    if (f.roundKey !== "GROUP" || !f.homeRu || !f.awayRu) continue;
    const winner = f.gh === null || f.ga === null ? null : f.gh > f.ga ? f.homeRu : f.ga > f.gh ? f.awayRu : "Ничья";
    out.push({ group: f.group, home: f.homeRu, away: f.awayRu, gh: f.gh, ga: f.ga, winner, penWinner: null });
  }
  return out;
}

/** Drop-in replacement for getSheetData: same SheetData shape, computed by us. */
export async function getPoolData(revalidate = 60): Promise<SheetData> {
  const [fixtures, standingsApi] = await Promise.all([getFixtures(revalidate), getStandings(revalidate)]);
  const actuals = buildActuals(fixtures, standingsApi);
  const { standings } = computeStandings(PARTICIPANTS, actuals);

  const participants: Record<string, SheetParticipant> = {};
  for (const p of PARTICIPANTS) participants[p.name] = p;

  return { standings, participants, results: buildResults(fixtures), fetchedAt: Date.now() };
}
