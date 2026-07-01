// Assembles the pool's scoring data WITHOUT the Google Sheet: locked predictions
// (baked in predictions.ts) + live actuals (API-Football fixtures + standings),
// run through the scoring engine. Returns the exact SheetData shape the rest of
// the app already consumes, so realData.ts / components are unchanged.
import { getFixtures, getStandings, type ApiFixture } from "./sources/apiFootball";
import { PARTICIPANTS } from "./predictions";
import { computeStandings, scoreParticipant, dayGainItems, stageKey, type Actuals, type KoResult, type StageKey, type GroupStanding, type RecentEvents } from "./scoring";
import type { Score, SheetData, SheetParticipant, GroupResult, GainItem } from "./sources/sheet";

const koWinner = (f: ApiFixture, home: string, away: string): string => {
  if (f.gh === null || f.ga === null) return "";
  if (f.gh > f.ga) return home;
  if (f.ga > f.gh) return away;
  if (f.penHome !== null && f.penAway !== null) return f.penHome > f.penAway ? home : away;
  return "";
};

const PREV_STAGE: Partial<Record<StageKey, StageKey>> = { r16: "r32", qf: "r16", sf: "qf", final: "sf" };

// Football "game day" key (YYYY-MM-DD). MSK with a NOON cutoff, so an evening's
// slate — including matches that spill past midnight (WC2026 is in the Americas,
// kickoffs run ~19:00–06:00 MSK with a clear midday gap) — groups into ONE day.
// Without this, a late match's points land on the next calendar date and get split
// from the same evening's earlier matches in the "Сводка за игровой день"
// (e.g. Норвегия 20:00 МСК vs Франция 00:00 МСК were two different days).
const MSK_MS = 3 * 3600 * 1000;
const gameDay = (ms: number) => new Date(ms + MSK_MS - 12 * 3600 * 1000).toISOString().slice(0, 10);

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

  // knockout results — deduped by match (stage + unordered pair). A knockout
  // match is played once; guarding against any duplicate API fixture stops a
  // LOSER from leaking into reachedStage (which would double a squad bonus).
  const koResults: KoResult[] = [];
  const seenKo = new Set<string>();
  for (const f of fixtures) {
    const k = stageKey(f.roundKey);
    if (!k) continue;
    if (!f.finished || f.gh === null || f.ga === null || !f.homeRu || !f.awayRu) continue;
    const matchKey = `${k}|${[f.homeRu, f.awayRu].sort().join("|")}`;
    if (seenKo.has(matchKey)) continue;
    seenKo.add(matchKey);
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

export type PointsRace = {
  days: string[];                                            // MSK dates (YYYY-MM-DD), in order
  rows: { name: string; seed: number; points: number[] }[]; // cumulative TOTAL per day
};

/** Per-game-day cumulative TOTAL points for every participant across the WHOLE
 *  tournament — drives the animated race. Each day folds in that day's group AND
 *  knockout results (a group's standing points turn on when its last match ends;
 *  squad bonus / final bets turn on with the deciding match). Null before kickoff. */
export function buildPointsRace(
  fixtures: ApiFixture[],
  standingsApi: { group: string; rank: number; teamRu: string | null; advanced: boolean }[],
): PointsRace | null {
  const mskDate = gameDay;
  const played = fixtures.filter((f) => f.finished && f.gh !== null && f.ga !== null && f.homeRu && f.awayRu);
  if (!played.length) return null;
  const days = [...new Set(played.map((f) => mskDate(f.timestamp * 1000)))].sort();

  // final group standings + each group's completion day (date of its last match)
  const byGroup: Record<string, { rank: number; team: string; advanced: boolean }[]> = {};
  for (const s of standingsApi) { if (!s.teamRu) continue; (byGroup[s.group] ??= []).push({ rank: s.rank, team: s.teamRu, advanced: s.advanced }); }
  const standings: Record<string, GroupStanding> = {};
  for (const [letter, rs] of Object.entries(byGroup)) {
    const r = [...rs].sort((a, b) => a.rank - b.rank);
    if (r.length >= 3) standings[letter] = { first: r[0].team, second: r[1].team, third: r[2].team, thirdAdvanced: !!r[2].advanced };
  }
  const groupClosed: Record<string, string> = {};
  for (const f of played) if (f.roundKey === "GROUP") { const d = mskDate(f.timestamp * 1000); if (!groupClosed[f.group] || d > groupClosed[f.group]) groupClosed[f.group] = d; }

  const emptyReached = (): Record<StageKey, Set<string>> => ({ r32: new Set(), r16: new Set(), qf: new Set(), sf: new Set(), third: new Set(), final: new Set() });
  const rows = PARTICIPANTS.map((p, i) => ({ name: p.name, seed: i, points: [] as number[] }));

  for (const D of days) {
    const upto = played.filter((f) => mskDate(f.timestamp * 1000) <= D);
    const groupResults = new Map<string, Score>();
    const koResults: KoResult[] = [];
    const reachedStage = emptyReached();
    let champion: string | null = null, finalist: string | null = null, third: string | null = null;
    for (const f of upto) {
      if (f.roundKey === "GROUP") { groupResults.set(`${f.homeRu}|${f.awayRu}`, [f.gh!, f.ga!]); continue; }
      const k = stageKey(f.roundKey);
      if (!k) continue;
      const w = koWinner(f, f.homeRu!, f.awayRu!);
      koResults.push({ stage: k, home: f.homeRu!, away: f.awayRu!, gh: f.gh!, ga: f.ga!, winner: w });
      if (k === "final" && w) { champion = w; finalist = w === f.homeRu ? f.awayRu! : f.homeRu!; }
      if (k === "third" && w) third = w;
    }
    for (const r of koResults) {
      const reached = PREV_TO_STAGE[r.stage]; // winner of this round reaches `reached`
      if (reached && r.winner) reachedStage[reached].add(r.winner);
    }
    const gs: Record<string, GroupStanding> = {};
    for (const [letter, st] of Object.entries(standings)) if (groupClosed[letter] && groupClosed[letter] <= D) gs[letter] = st;
    const actuals: Actuals = { groupResults, groupStandings: gs, koResults, reachedStage, champion, finalist, third };
    PARTICIPANTS.forEach((p, i) => rows[i].points.push(scoreParticipant(p, actuals).total));
  }
  return { days, rows };
}

// previous round → the bonus stage a winner of it reaches (none for sf→third)
const PREV_TO_STAGE: Partial<Record<StageKey, StageKey>> = { r32: "r16", r16: "qf", qf: "sf", sf: "final" };

/** Map the matches that resolved in the last 24h into RecentEvents (RU names). */
function buildRecentEvents(recentFixtures: ApiFixture[]): RecentEvents {
  const ko: KoResult[] = [];
  const group: { home: string; away: string; gh: number; ga: number }[] = [];
  const reached: { team: string; stage: StageKey }[] = [];
  let champion: string | null = null, finalist: string | null = null, third: string | null = null;
  for (const f of recentFixtures) {
    if (!f.homeRu || !f.awayRu || f.gh === null || f.ga === null) continue;
    if (f.roundKey === "GROUP") { group.push({ home: f.homeRu, away: f.awayRu, gh: f.gh, ga: f.ga }); continue; }
    const k = stageKey(f.roundKey);
    if (!k) continue;
    const w = koWinner(f, f.homeRu, f.awayRu);
    ko.push({ stage: k, home: f.homeRu, away: f.awayRu, gh: f.gh, ga: f.ga, winner: w });
    const next = PREV_TO_STAGE[k];
    if (next && w) reached.push({ team: w, stage: next });
    if (k === "final" && w) { champion = w; finalist = w === f.homeRu ? f.awayRu : f.homeRu; }
    if (k === "third" && w) third = w;
  }
  return { ko, group, reached, champion, finalist, third };
}

/** Drop-in replacement for getSheetData: same SheetData shape, computed by us. */
export async function getPoolData(revalidate = 60): Promise<SheetData> {
  const [fixtures, standingsApi] = await Promise.all([getFixtures(revalidate), getStandings(revalidate)]);
  const actuals = buildActuals(fixtures, standingsApi);
  const { standings, breakdown } = computeStandings(PARTICIPANTS, actuals);

  // GAME-DAY summary = the latest MSK calendar day on which any match was played,
  // counting every match that KICKED OFF that day (a 23:30 match that ends after
  // midnight still belongs to its start day). Gains = total now − total re-scored
  // without that day's matches, so it covers match points, squad bonus AND final
  // bets — never invented. The day rolls forward as soon as a newer match finishes.
  const now = Date.now();
  const mskDate = gameDay;
  const playedDates = fixtures.filter((f) => f.finished).map((f) => mskDate(f.timestamp * 1000)).sort();
  const dayDate = playedDates.length ? playedDates[playedDates.length - 1] : mskDate(now);
  const recent = (f: ApiFixture) => f.finished && mskDate(f.timestamp * 1000) === dayDate;
  const { breakdown: before } = computeStandings(PARTICIPANTS, buildActuals(fixtures.filter((f) => !recent(f)), standingsApi));
  const dayGains: Record<string, number> = {};
  for (const p of PARTICIPANTS) dayGains[p.name] = breakdown[p.name].total - before[p.name].total;

  // itemised breakdown — which match / bonus / bet gave each participant points that day
  const recentEvents = buildRecentEvents(fixtures.filter(recent));
  const dayBreakdown: Record<string, GainItem[]> = {};
  for (const p of PARTICIPANTS) {
    const items = dayGainItems(p, recentEvents);
    const remainder = dayGains[p.name] - items.reduce((s, it) => s + it.points, 0);
    if (remainder > 0) items.push({ kind: "group", label: "Прочие очки за день", detail: "пересчёт по итогам этапа", points: remainder });
    dayBreakdown[p.name] = items;
  }

  const participants: Record<string, SheetParticipant> = {};
  for (const p of PARTICIPANTS) participants[p.name] = p;

  return { standings, participants, results: buildResults(fixtures), fetchedAt: now, dayGains, dayBreakdown, dayDate };
}
