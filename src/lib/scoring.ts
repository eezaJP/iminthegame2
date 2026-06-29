// The scoring ENGINE — the single source of truth for points, ported 1:1 from the
// pool workbook formulas (see scripts/gen-predictions.mjs for the locked inputs).
// Pure functions only: (locked predictions) × (live actuals from API-Football) → points.
//
// Rules (HYBRID system):
//   Group match:      correct outcome 2, exact score 5
//   Group standings:  group winner (1st) 4; both qualifiers (1st+2nd, any order) 6;
//                     correct 3rd that advanced +4
//   Playoff per match (выигрыш / точный счёт), matched by TEAM PAIRING within the stage:
//                     1/16 3/8, 1/8 5/12, 1/4 8/18, 1/2 15/35, за 3-е 12/28, финал 25/55
//   Squad bonus (per correctly-named team that REACHED the stage):
//                     1/8 +2, 1/4 +3, 1/2 +5, финал +8  (no bonus for the 1/16)
//   Final bets:       champion 55, finalist 15, 3rd place 8
//   Tie-break:        more exact scores → more bet points → more playoff points → split
import type { Score, SheetParticipant, Standing } from "./sources/sheet";

export type StageKey = "r32" | "r16" | "qf" | "sf" | "third" | "final";

/** A finished knockout match, in RU names. winner = team that advanced (pens resolved). */
export type KoResult = { stage: StageKey; home: string; away: string; gh: number; ga: number; winner: string };

export type GroupStanding = { first: string; second: string; third: string; thirdAdvanced: boolean };

export type Actuals = {
  /** "Home|Away" (RU) -> [gh, ga] for every FINISHED group match. */
  groupResults: Map<string, Score>;
  /** group letter (A..L) -> actual 1st/2nd/3rd + whether the 3rd advanced. */
  groupStandings: Record<string, GroupStanding>;
  /** every finished knockout match. */
  koResults: KoResult[];
  /** stage key -> set of RU teams that REACHED that stage (won the previous round). */
  reachedStage: Record<StageKey, Set<string>>;
  champion: string | null;
  finalist: string | null;
  third: string | null;
};

// per-stage match points: [exactPts, winnerPts]
const KO_PTS: Record<StageKey, [number, number]> = {
  r32: [8, 3], r16: [12, 5], qf: [18, 8], sf: [35, 15], third: [28, 12], final: [55, 25],
};
// squad bonus per team reaching the stage (none for r32 / third)
const SQUAD_BONUS: Partial<Record<StageKey, number>> = { r16: 2, qf: 3, sf: 5, final: 8 };

/** Normalise a stage label (sheet/bracket) or API round key to a StageKey. */
export function stageKey(label: string): StageKey | null {
  const s = label.toLowerCase();
  if (s.includes("1/16") || s === "r32") return "r32";
  if (s.includes("1/8") || s === "r16") return "r16";
  if (s.includes("1/4") || s === "qf") return "qf";
  if (s.includes("1/2") || s === "sf") return "sf";
  if (s.includes("за 3") || s.includes("3-е") || s === "third") return "third";
  if (s.includes("финал") || s === "final") return "final";
  return null;
}

const gmPoints = ([ph, pa]: Score, [gh, ga]: Score): number =>
  ph === gh && pa === ga ? 5 : Math.sign(ph - pa) === Math.sign(gh - ga) ? 2 : 0;

/** Actual result for a "Home|Away" prediction key, tolerant of stored orientation. */
function resultFor(groupResults: Map<string, Score>, key: string): Score | null {
  const direct = groupResults.get(key);
  if (direct) return direct;
  const [h, a] = key.split("|");
  const rev = groupResults.get(`${a}|${h}`);
  return rev ? [rev[1], rev[0]] : null;
}

export type Breakdown = {
  groupMatches: number;
  groupStandings: number;
  playoffMatches: number;
  squadBonus: number;
  finalBets: number;
  total: number;
  exact: number; // exact-score count (group 5s + playoff exact hits) — drives tie-break/oracle
};

export function scoreParticipant(p: SheetParticipant, a: Actuals): Breakdown {
  let groupMatches = 0, exact = 0;

  // ---- group matches ----
  for (const [key, pred] of Object.entries(p.predictions)) {
    const res = resultFor(a.groupResults, key);
    if (!res) continue;
    const pts = gmPoints(pred, res);
    groupMatches += pts;
    if (pts === 5) exact++;
  }

  // ---- group standings ----
  let groupStandings = 0;
  for (const [letter, place] of Object.entries(p.placings)) {
    const act = a.groupStandings[letter];
    if (!act) continue;
    const [p1, p2, p3] = place;
    if (p1 && p1 === act.first) groupStandings += 4;
    const predPair = new Set([p1, p2].filter(Boolean));
    const actPair = new Set([act.first, act.second]);
    if (predPair.size === 2 && [...predPair].every((t) => actPair.has(t))) groupStandings += 6;
    if (p3 && p3 === act.third && act.thirdAdvanced) groupStandings += 4;
  }

  // ---- playoff matches (matched by team pairing within the stage) ----
  // NO double-counting: a real match can score only ONCE even if the participant
  // wrote the same pairing in several slots (data-entry dupes) — we keep the BEST
  // pick per real match. Teams predicted at a stage are deduped via a Set, so a
  // team listed twice never earns its points/bonus twice.
  const best = new Map<string, { pts: number; exact: boolean }>(); // real-match id -> best pick
  const reachedPred: Record<string, Set<string>> = {}; // stageKey -> predicted teams (deduped, for bonus)
  for (const pick of p.bracket) {
    const k = stageKey(pick.stage);
    if (!k) continue;
    // record predicted teams at this stage (Set → each team counts once for the bonus)
    (reachedPred[k] ??= new Set());
    if (pick.home) reachedPred[k].add(pick.home);
    if (pick.away) reachedPred[k].add(pick.away);
    if (!pick.home || !pick.away) continue;
    const real = a.koResults.find(
      (r) => r.stage === k && ((r.home === pick.home && r.away === pick.away) || (r.home === pick.away && r.away === pick.home))
    );
    if (!real) continue;
    const [PE, PW] = KO_PTS[k];
    // orient actual goals to the predicted (home, away)
    const actHome = real.home === pick.home ? real.gh : real.ga;
    const actAway = real.home === pick.home ? real.ga : real.gh;
    let pts = 0, isExact = false;
    if (pick.gh !== null && pick.ga !== null && pick.gh === actHome && pick.ga === actAway) {
      pts = PE; isExact = true;
    } else {
      const predW = pick.advances || (pick.gh != null && pick.ga != null ? (pick.gh > pick.ga ? pick.home : pick.ga > pick.gh ? pick.away : "") : "");
      if (predW && predW === real.winner) pts = PW;
    }
    const id = `${real.stage}|${real.home}|${real.away}`;
    const cur = best.get(id);
    if (!cur || pts > cur.pts) best.set(id, { pts, exact: isExact });
  }
  let playoffMatches = 0;
  for (const { pts, exact: ex } of best.values()) { playoffMatches += pts; if (ex) exact++; }

  // ---- squad bonus (per UNIQUE predicted team that reached the stage) ----
  let squadBonus = 0;
  for (const [k, per] of Object.entries(SQUAD_BONUS) as [StageKey, number][]) {
    const predicted = reachedPred[k]; // a Set — a team listed twice is counted once
    const reached = a.reachedStage[k];
    if (!predicted || !reached) continue;
    let n = 0;
    for (const t of predicted) if (reached.has(t)) n++;
    squadBonus += n * per;
  }

  // ---- final bets ----
  let finalBets = 0;
  if (p.bets.champion && a.champion && p.bets.champion === a.champion) finalBets += 55;
  if (p.bets.finalist && a.finalist && p.bets.finalist === a.finalist) finalBets += 15;
  if (p.bets.third && a.third && p.bets.third === a.third) finalBets += 8;

  const total = groupMatches + groupStandings + playoffMatches + squadBonus + finalBets;
  return { groupMatches, groupStandings, playoffMatches, squadBonus, finalBets, total, exact };
}

/** Score everyone and return Standing[] (sheet-compatible) sorted by the tie-break. */
export function computeStandings(participants: SheetParticipant[], a: Actuals): { standings: Standing[]; breakdown: Record<string, Breakdown> } {
  const breakdown: Record<string, Breakdown> = {};
  const rows = participants.map((p) => {
    const b = scoreParticipant(p, a);
    breakdown[p.name] = b;
    return {
      name: p.name,
      total: b.total,
      exact: b.exact,
      betPts: b.finalBets,
      playoffPts: b.playoffMatches + b.squadBonus, // sheet "ПО" = matches + squad bonus
    };
  });
  // tie-break: total → exact → bet pts → playoff pts
  rows.sort((x, y) => y.total - x.total || y.exact - x.exact || y.betPts - x.betPts || y.playoffPts - x.playoffPts || x.name.localeCompare(y.name));
  const standings: Standing[] = rows.map((r, i) => ({ rank: i + 1, ...r }));
  return { standings, breakdown };
}
