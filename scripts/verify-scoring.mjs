// Executable check of the scoring formulas against the rules in /rules.
// Mirrors the implementations in src/lib/realData.ts and src/lib/sources so the
// rule matrix can be verified without a live Google Sheet / API-Football key.
//
//   node scripts/verify-scoring.mjs
//
// Group stage:      outcome (П1/Х/П2) = 2, exact score = 5
// Tie-break order:  points → exact scores → final-bet points → playoff points
// Playoff rounds:   1/16→r32, 1/8→r16, 1/4→qf, 1/2→sf, за 3→third, финал→f

let failed = 0;
const eq = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { failed++; console.error(`✗ ${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); }
  else console.log(`✓ ${label}`);
};

// ---- src/lib/realData.ts: gmPoints ----
const gmPoints = ([ph, pa], [gh, ga]) =>
  ph === gh && pa === ga ? 5 : Math.sign(ph - pa) === Math.sign(gh - ga) ? 2 : 0;

eq("exact score → 5", gmPoints([2, 1], [2, 1]), 5);
eq("exact draw → 5", gmPoints([0, 0], [0, 0]), 5);
eq("right winner, wrong score → 2", gmPoints([2, 0], [3, 1]), 2);
eq("right draw, wrong score → 2", gmPoints([1, 1], [2, 2]), 2);
eq("wrong outcome (pred draw, real home win) → 0", gmPoints([1, 1], [2, 1]), 0);
eq("wrong outcome (pred home, real away) → 0", gmPoints([2, 1], [1, 2]), 0);

// ---- src/lib/realData.ts: predFor (orientation-agnostic lookup) ----
const predFor = (preds, home, away) => {
  const d = preds[`${home}|${away}`];
  if (d) return { ph: d[0], pa: d[1] };
  const rev = preds[`${away}|${home}`];
  if (rev) return { ph: rev[1], pa: rev[0] };
  return null;
};

// A pick stored home/away-flipped from the results tab must still score. This
// is the bug the fix addresses: the old loop used results.get(key) directly and
// silently dropped flipped matches.
const flippedPreds = { "Бразилия|Сербия": [2, 0] };
const flipped = predFor(flippedPreds, "Сербия", "Бразилия"); // result orientation
eq("flipped pick is found", flipped, { ph: 0, pa: 2 });
eq("flipped pick scores exact vs 0:2", gmPoints([flipped.ph, flipped.pa], [0, 2]), 5);

// ---- src/lib/realData.ts: tie-break comparator ----
const cmp = (a, b) =>
  b.total - a.total ||
  b.exact - a.exact ||
  b.bets - a.bets ||
  b.playoff - a.playoff;
const sorted = [
  { name: "A", total: 100, exact: 5, bets: 0, playoff: 0 },
  { name: "B", total: 100, exact: 7, bets: 0, playoff: 0 }, // more exact → ahead
  { name: "C", total: 100, exact: 7, bets: 10, playoff: 0 }, // same exact, more bets → ahead
  { name: "D", total: 110, exact: 1, bets: 0, playoff: 0 }, // more points → first
].sort(cmp).map((p) => p.name);
eq("tie-break order", sorted, ["D", "C", "B", "A"]);

// ---- src/lib/realData.ts: stageToRound (participant bracket) ----
const stageToRound = (stage) => {
  const s = stage.toLowerCase();
  if (s.includes("1/16")) return "r32";
  if (s.includes("1/8")) return "r16";
  if (s.includes("1/4")) return "qf";
  if (s.includes("1/2")) return "sf";
  if (s.includes("за 3")) return "third";
  if (s.includes("финал")) return "f";
  return null;
};
eq("1/16 финала → r32", stageToRound("1/16 финала"), "r32");
eq("1/8 финала → r16", stageToRound("1/8 финала"), "r16");
eq("1/4 финала → qf", stageToRound("1/4 финала"), "qf");
eq("1/2 финала → sf", stageToRound("1/2 финала"), "sf");
eq("за 3-е место → third", stageToRound("Матч за 3-е место"), "third");
eq("Финал → f", stageToRound("Финал"), "f");

// ---- src/lib/sources/apiFootball.ts: roundKey (real bracket) ----
const roundKey = (round) => {
  const r = round.toLowerCase();
  if (r.includes("group")) return "GROUP";
  if (r.includes("3rd") || r.includes("third")) return "THIRD";
  if (r.includes("semi")) return "SF";
  if (r.includes("quarter")) return "QF";
  if (r.includes("16")) return "R16";
  if (r.includes("32")) return "R32";
  if (r.includes("final")) return "FINAL";
  return "OTHER";
};
eq("Round of 32 → R32", roundKey("Round of 32"), "R32");
eq("Round of 16 → R16", roundKey("Round of 16"), "R16");
eq("Quarter-finals → QF", roundKey("Quarter-finals"), "QF");
eq("Semi-finals → SF (not FINAL)", roundKey("Semi-finals"), "SF");
eq("3rd Place Final → THIRD (not FINAL)", roundKey("3rd Place Final"), "THIRD");
eq("Final → FINAL", roundKey("Final"), "FINAL");

// ---- src/lib/realData.ts: knownMatches (resolved 1/16 pairs, max 16) ----
const r32 = [
  { a: { n: "A" }, b: { n: "B" } },
  { a: { n: "C" }, b: { n: "D" } },
  { a: null, b: null },
];
const knownMatches = r32.filter((m) => m.a && m.b).length;
eq("knownMatches counts resolved 1/16 pairs only", knownMatches, 2);

// ---- src/lib/playoffScore.ts: live playoff scoring ----
// Mirrors scorePlayoff/koResultsFromFixtures so the rule matrix is checkable
// without an API-Football key. Canada wins its 1/16 → advances to the 1/8.
const WIN = { r32: 3, r16: 5, qf: 8, sf: 15, third: 12, f: 25 };
const EXACT = { r32: 8, r16: 12, qf: 18, sf: 35, third: 28, f: 55 };
const BONUS = { r16: 2, qf: 3, sf: 5, f: 8 };
const FEEDS = { r16: "r32", qf: "r16", sf: "qf", f: "sf" };
const samePair = (a1, b1, a2, b2) => !!a1 && !!b1 && ((a1 === a2 && b1 === b2) || (a1 === b2 && b1 === a2));
const stageKey = (s) => {
  s = s.toLowerCase();
  if (s.includes("1/16")) return "r32";
  if (s.includes("1/8")) return "r16";
  if (s.includes("1/4")) return "qf";
  if (s.includes("1/2")) return "sf";
  if (s.includes("за 3")) return "third";
  if (s.includes("финал")) return "f";
  return null;
};
function scorePlayoff(bracket, ko) {
  const byStage = { r32: [], r16: [], qf: [], sf: [], third: [], f: [] };
  for (const p of bracket) { const k = stageKey(p.stage); if (k) byStage[k].push(p); }
  let matchPts = 0, exact = 0, bonus = 0;
  for (const key of ["r32", "r16", "qf", "sf", "third", "f"]) {
    for (const rm of ko.matches[key] ?? []) {
      const pick = byStage[key].find((p) => samePair(p.home, p.away, rm.a, rm.b));
      if (!pick) continue;
      let pgh = pick.gh, pga = pick.ga;
      if (pick.home === rm.b && pick.away === rm.a) { pgh = pick.ga; pga = pick.gh; }
      if (pgh !== null && pga !== null && pgh === rm.gh && pga === rm.ga) { matchPts += EXACT[key]; exact++; }
      else {
        const predAdv = pick.advances || (pick.gh !== null && pick.ga !== null
          ? (pick.gh > pick.ga ? pick.home : pick.ga > pick.gh ? pick.away : "") : "");
        if (predAdv && predAdv === rm.winner) matchPts += WIN[key];
      }
    }
  }
  for (const key of ["r16", "qf", "sf", "f"]) {
    const reached = ko.advancers[FEEDS[key]] ?? new Set();
    if (!reached.size) continue;
    const predicted = new Set();
    for (const p of byStage[key]) { if (p.home) predicted.add(p.home); if (p.away) predicted.add(p.away); }
    for (const t of predicted) if (reached.has(t)) bonus += BONUS[key];
  }
  return { matchPts, bonus, exact, total: matchPts + bonus };
}

// Canada beat Mexico 2:1 in the 1/16 and went through to the 1/8.
const ko = {
  matches: { r32: [{ a: "Канада", b: "Мексика", gh: 2, ga: 1, winner: "Канада" }], r16: [], qf: [], sf: [], third: [], f: [] },
  advancers: { r32: new Set(["Канада"]), r16: new Set(), qf: new Set(), sf: new Set(), third: new Set(), f: new Set() },
};

// predicted Canada into the 1/8 → +2 stage bonus the moment the 1/16 ends
eq("squad bonus +2 for a team that reached the 1/8",
  scorePlayoff([{ stage: "1/8 финала", home: "Канада", away: "Хорватия", gh: 1, ga: 0, advances: "Канада" }], ko).bonus, 2);

// predicted the exact 1/16 score → 8 match pts, no bonus (1/16 has none)
eq("exact 1/16 score → 8 pts, no 1/16 bonus",
  scorePlayoff([{ stage: "1/16 финала", home: "Канада", away: "Мексика", gh: 2, ga: 1, advances: "Канада" }], ko),
  { matchPts: 8, bonus: 0, exact: 1, total: 8 });

// right advancer, wrong score → 3 match pts (1/16 outcome)
eq("right 1/16 advancer, wrong score → 3 pts",
  scorePlayoff([{ stage: "1/16 финала", home: "Канада", away: "Мексика", gh: 3, ga: 0, advances: "Канада" }], ko).matchPts, 3);

// pick stored flipped vs the real fixture still scores exact
eq("flipped 1/16 matchup still scores exact",
  scorePlayoff([{ stage: "1/16 финала", home: "Мексика", away: "Канада", gh: 1, ga: 2, advances: "Канада" }], ko).matchPts, 8);

// a team that didn't reach the stage earns nothing
eq("no bonus for a team that lost the 1/16",
  scorePlayoff([{ stage: "1/8 финала", home: "Мексика", away: "Хорватия", gh: 1, ga: 0, advances: "Мексика" }], ko).bonus, 0);

console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll scoring checks passed ✓");
process.exit(failed ? 1 : 0);
