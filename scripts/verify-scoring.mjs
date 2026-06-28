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

console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll scoring checks passed ✓");
process.exit(failed ? 1 : 0);
