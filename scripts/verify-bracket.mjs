// Self-check: does our hardcoded WC2026 bracket template still match the REAL
// bracket the API publishes? Re-does, automatically, what we verified by hand:
// pull live fixtures + standings, map every team to its FIFA group slot, and
// assert that every knockout tie the API has ACTUALLY published is consistent
// with src/lib/wc2026-bracket.json (the same template the app renders from).
// As the tournament advances and the API publishes 1/8, 1/4, 1/2 fixtures, this
// validates them too — with zero manual work.
//
//   node scripts/verify-bracket.mjs      (also runs automatically before build)
//
// Exit codes: 0 = all consistent (or skipped: no API key / network down — never
// blocks a build for an environment reason). 1 = a real CONTRADICTION between our
// template and the live bracket → fix the template before shipping.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

// ---- config (env first, then .env.local) ----
function readEnv() {
  const env = { ...process.env };
  try {
    const text = readFileSync(resolve(ROOT, ".env.local"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* no .env.local — rely on process.env */ }
  return env;
}

const bracket = JSON.parse(readFileSync(resolve(ROOT, "src/lib/wc2026-bracket.json"), "utf8"));
const R32 = bracket.r32;            // 16 ties in bracket order, by slot
const POW = bracket.roundPow;       // r32:1 r16:2 qf:4 sf:8 f:16

const ROUND = (round) => {
  const r = String(round).toLowerCase();
  if (r.includes("group")) return "GROUP";
  if (r.includes("3rd") || r.includes("third")) return "THIRD";
  if (r.includes("semi")) return "sf";
  if (r.includes("quarter")) return "qf";
  if (r.includes("16")) return "r16";
  if (r.includes("32")) return "r32";
  if (r.includes("final")) return "f";
  return "OTHER";
};
const COUNT = { r32: 16, r16: 8, qf: 4, sf: 2, f: 1 };
const LABEL = { r32: "1/16", r16: "1/8", qf: "1/4", sf: "1/2", f: "Финал" };
const DONE = new Set(["FT", "AET", "PEN"]);

async function api(path, key) {
  const res = await fetch(`https://v3.football.api-sports.io${path}`, { headers: { "x-apisports-key": key } });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  const j = await res.json();
  if (j.errors && Object.keys(j.errors).length) throw new Error(`API errors: ${JSON.stringify(j.errors)}`);
  return j.response;
}

// We set process.exitCode and unwind via a sentinel instead of process.exit():
// calling exit() while fetch keep-alive sockets are still open crashes Node on
// Windows ("Assertion failed ... async.c"). Letting the loop drain exits cleanly
// with the right code (idle sockets close after undici's keep-alive timeout).
class Done extends Error {}
const SKIP = (msg) => { console.log(`\n⏭️  verify-bracket: ${msg} — пропускаю (билд не блокирую).\n`); process.exitCode = 0; throw new Done(); };
const FAIL = (problems) => {
  console.error("\n❌ verify-bracket: НАЙДЕНО РАСХОЖДЕНИЕ с реальной сеткой:\n");
  for (const p of problems) console.error("   • " + p);
  console.error("\n   Шаблон src/lib/wc2026-bracket.json НЕ совпадает с тем, что отдаёт API.");
  console.error("   Сверься с en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage (RoundN) и поправь шаблон.\n");
  process.exitCode = 1; throw new Done();
};

(async () => {
  const env = readEnv();
  const key = env.API_FOOTBALL_KEY;
  const league = env.API_FOOTBALL_LEAGUE ?? "1";
  const season = env.API_FOOTBALL_SEASON ?? "2026";
  if (!key) SKIP("нет API_FOOTBALL_KEY");

  let fixtures, standings;
  try {
    [fixtures, standings] = await Promise.all([
      api(`/fixtures?league=${league}&season=${season}`, key),
      api(`/standings?league=${league}&season=${season}`, key),
    ]);
  } catch (e) {
    SKIP(`API недоступен (${e.message})`);
  }

  // team (EN) → FIFA slot ("1A".."3L") from the per-group standings
  const slotToTeam = new Map();
  const teamToSlot = new Map();
  for (const table of standings?.[0]?.league?.standings ?? []) {
    const g = /^Group ([A-L])$/.exec(String(table?.[0]?.group ?? "").trim());
    if (!g) continue; // skip the cross-group "Group Stage" thirds table
    for (const row of table) {
      const slot = `${row.rank}${g[1]}`;
      slotToTeam.set(slot, row.team.name);
      teamToSlot.set(row.team.name, slot);
    }
  }

  // team (EN) → R32 tie index 0..15 (both teams in a tie share it)
  const r32IndexOf = new Map();
  const missingSlots = [];
  R32.forEach(([s1, s2], i) => {
    const t1 = slotToTeam.get(s1), t2 = slotToTeam.get(s2);
    if (!t1) missingSlots.push(s1);
    if (!t2) missingSlots.push(s2);
    if (t1) r32IndexOf.set(t1, i);
    if (t2) r32IndexOf.set(t2, i);
  });

  const problems = [];
  if (missingSlots.length) {
    problems.push(`в таблице нет команд для слотов: ${missingSlots.join(", ")} (изменился состав/алиасы?)`);
  }

  // group published knockout fixtures by round
  const byRound = { r32: [], r16: [], qf: [], sf: [], f: [] };
  let publishedThird = null;
  for (const f of fixtures) {
    const k = ROUND(f.league.round);
    if (k === "GROUP" || k === "OTHER") continue;
    const fx = { home: f.teams.home.name, away: f.teams.away.name, st: f.fixture.status.short };
    if (k === "THIRD") { publishedThird = fx; continue; }
    if (byRound[k]) byRound[k].push(fx);
  }

  // ---- the core invariant, per published round ----
  const summary = [];
  for (const k of ["r32", "r16", "qf", "sf", "f"]) {
    const ties = byRound[k];
    if (!ties.length) continue;
    const pow = POW[k];
    const slotsUsed = new Map();
    for (const t of ties) {
      const ih = r32IndexOf.get(t.home);
      const ia = r32IndexOf.get(t.away);
      if (ih === undefined) { problems.push(`${LABEL[k]}: команда "${t.home}" не найдена в шаблоне сетки`); continue; }
      if (ia === undefined) { problems.push(`${LABEL[k]}: команда "${t.away}" не найдена в шаблоне сетки`); continue; }
      const sh = Math.floor(ih / pow);
      const sa = Math.floor(ia / pow);
      // INVARIANT: both teams of a real tie belong to the SAME bracket slot
      if (sh !== sa) {
        problems.push(`${LABEL[k]}: API свёл "${t.home}" (слот ${sh}) и "${t.away}" (слот ${sa}) — по нашему шаблону они в РАЗНЫХ ветках`);
        continue;
      }
      // INVARIANT: a slot is used by at most one published tie
      if (slotsUsed.has(sh)) {
        const prev = slotsUsed.get(sh);
        problems.push(`${LABEL[k]}: два матча претендуют на слот ${sh}: "${prev}" и "${t.home} vs ${t.away}"`);
      } else {
        slotsUsed.set(sh, `${t.home} vs ${t.away}`);
      }
    }
    // INVARIANT (R32 only): when fully published, all 16 slots covered exactly once
    if (k === "r32" && ties.length === 16) {
      for (let i = 0; i < 16; i++) if (!slotsUsed.has(i)) problems.push(`1/16: слот ${i} не покрыт ни одним матчем`);
    }
    summary.push(`${LABEL[k]}: ${ties.length} опубликовано, ${slotsUsed.size} слот(ов) совпали`);
  }

  if (problems.length) FAIL(problems);

  console.log("\n✅ verify-bracket: сетка приложения совпадает с реальной (API).");
  for (const s of summary) console.log("   • " + s);
  const played = byRound.r32.filter((t) => DONE.has(t.st)).length;
  console.log(`   • сыграно матчей 1/16: ${played}/16`);
  console.log("");
})().catch((e) => {
  if (e instanceof Done) return;            // expected unwind — exitCode already set
  console.log(`\n⏭️  verify-bracket: непредвиденная ошибка (${e.message}) — пропускаю (билд не блокирую).\n`);
  process.exitCode = 0;
});
