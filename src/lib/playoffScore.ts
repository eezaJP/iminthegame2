// Live playoff scoring — computed from real knockout results, NOT read from a
// manually-maintained sheet column. As soon as a 1/16 match finishes, the
// winner "advances" to the 1/8 and every participant who placed that team at
// that stage is credited immediately (squad bonus), and any participant whose
// predicted matchup actually happened gets outcome/exact match points. The same
// cascades through 1/4, 1/2, 3rd-place and the final.
//
// Points (from /rules):
//   match    1/16 3/8 · 1/8 5/12 · 1/4 8/18 · 1/2 15/35 · 3rd 12/28 · final 25/55
//   stage    team in 1/8 +2 · 1/4 +3 · 1/2 +5 · final +8   (no bonus for 1/16)
//   knockout: pens ignored — score is end-of-extra-time, winner = who advanced.
import type { PlayoffPick } from "./sources/sheet";
import type { ApiFixture } from "./sources/apiFootball";

export type StageKey = "r32" | "r16" | "qf" | "sf" | "third" | "f";
const STAGES: StageKey[] = ["r32", "r16", "qf", "sf", "third", "f"];

const WIN: Record<StageKey, number> = { r32: 3, r16: 5, qf: 8, sf: 15, third: 12, f: 25 };
const EXACT: Record<StageKey, number> = { r32: 8, r16: 12, qf: 18, sf: 35, third: 28, f: 55 };
// reached-stage bonus and which round's winners "reach" it (no bonus for 1/16
// or the 3rd-place match):
const BONUS: Partial<Record<StageKey, number>> = { r16: 2, qf: 3, sf: 5, f: 8 };
const FEEDS: Partial<Record<StageKey, StageKey>> = { r16: "r32", qf: "r16", sf: "qf", f: "sf" };

const RK: Record<string, StageKey> = { R32: "r32", R16: "r16", QF: "qf", SF: "sf", THIRD: "third", FINAL: "f" };

function stageKey(stage: string): StageKey | null {
  const s = stage.toLowerCase();
  if (s.includes("1/16")) return "r32";
  if (s.includes("1/8")) return "r16";
  if (s.includes("1/4")) return "qf";
  if (s.includes("1/2")) return "sf";
  if (s.includes("за 3")) return "third";
  if (s.includes("финал")) return "f";
  return null;
}

const samePair = (a1: string, b1: string, a2: string, b2: string) =>
  !!a1 && !!b1 && ((a1 === a2 && b1 === b2) || (a1 === b2 && b1 === a2));

export type KoMatch = { a: string; b: string; gh: number; ga: number; winner: string };
export type KoResults = {
  started: boolean;
  matches: Record<StageKey, KoMatch[]>;
  // teams that WON (advanced out of) each stage = reached the next stage
  advancers: Record<StageKey, Set<string>>;
};

/** Normalise finished knockout fixtures into per-stage results + advancers.
 *  Winner is by end-of-ET score; if drawn, by the penalty shootout (who went
 *  through) — the shootout never adds goals, it only resolves who advanced. */
export function koResultsFromFixtures(fixtures: ApiFixture[]): KoResults {
  const matches = { r32: [], r16: [], qf: [], sf: [], third: [], f: [] } as KoResults["matches"];
  const advancers = {
    r32: new Set<string>(), r16: new Set<string>(), qf: new Set<string>(),
    sf: new Set<string>(), third: new Set<string>(), f: new Set<string>(),
  };
  let started = false;
  for (const f of fixtures) {
    const key = RK[f.roundKey];
    if (!key || !f.finished || f.gh === null || f.ga === null || !f.homeRu || !f.awayRu) continue;
    started = true;
    const a = f.homeRu, b = f.awayRu;
    const winner =
      f.gh > f.ga ? a : f.ga > f.gh ? b
      : f.penHome !== null && f.penAway !== null ? (f.penHome > f.penAway ? a : b) : "";
    matches[key].push({ a, b, gh: f.gh, ga: f.ga, winner });
    if (winner) advancers[key].add(winner);
  }
  return { started, matches, advancers };
}

export type PlayoffScore = { matchPts: number; bonus: number; exact: number; total: number };

/** Score one participant's blind bracket against the live knockout results. */
export function scorePlayoff(bracket: PlayoffPick[], ko: KoResults): PlayoffScore {
  const byStage = { r32: [], r16: [], qf: [], sf: [], third: [], f: [] } as Record<StageKey, PlayoffPick[]>;
  for (const p of bracket) {
    const k = stageKey(p.stage);
    if (k) byStage[k].push(p);
  }

  let matchPts = 0, exact = 0, bonus = 0;

  // ---- match points: a real matchup that the participant also predicted ----
  for (const key of STAGES) {
    for (const rm of ko.matches[key]) {
      const pick = byStage[key].find((p) => samePair(p.home, p.away, rm.a, rm.b));
      if (!pick) continue;
      // orient the predicted score to the real home/away
      let pgh = pick.gh, pga = pick.ga;
      if (pick.home === rm.b && pick.away === rm.a) { pgh = pick.ga; pga = pick.gh; }
      if (pgh !== null && pga !== null && pgh === rm.gh && pga === rm.ga) {
        matchPts += EXACT[key];
        exact++;
      } else {
        const predAdv =
          pick.advances ||
          (pick.gh !== null && pick.ga !== null
            ? pick.gh > pick.ga ? pick.home : pick.ga > pick.gh ? pick.away : ""
            : "");
        if (predAdv && predAdv === rm.winner) matchPts += WIN[key];
      }
    }
  }

  // ---- stage squad bonus: predicted a team that actually reached the stage ----
  for (const key of ["r16", "qf", "sf", "f"] as StageKey[]) {
    const reached = ko.advancers[FEEDS[key]!];
    const pts = BONUS[key]!;
    if (!reached.size) continue;
    const predicted = new Set<string>();
    for (const p of byStage[key]) { if (p.home) predicted.add(p.home); if (p.away) predicted.add(p.away); }
    for (const t of predicted) if (reached.has(t)) bonus += pts;
  }

  return { matchPts, bonus, exact, total: matchPts + bonus };
}
