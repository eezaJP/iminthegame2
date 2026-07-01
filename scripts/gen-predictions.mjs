// Bakes the LOCKED participant predictions (group scores, group placings, blind
// playoff bracket, final bets) from the pool workbook into src/lib/predictions.ts.
// These inputs never change during the tournament — the app computes all scoring
// itself from these + live API-Football results (see src/lib/scoring.ts).
//
// Re-run if predictions ever change:  node scripts/gen-predictions.mjs [path-to-xlsx]
import * as XLSX from "xlsx";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = process.argv[2] || "C:/Users/alexe/OneDrive/Desktop/WC HTML/WC2026_scoring_v3_24_FIXED.xlsx";
const OUT = path.join(__dirname, "..", "src", "lib", "predictions.ts");

// RU team set (must mirror teams.ts keys)
const teamsTs = fs.readFileSync(path.join(__dirname, "..", "src", "lib", "teams.ts"), "utf8");
const RU_TEAMS = new Set([...teamsTs.matchAll(/^\s*"([^"]+)":\s*\{/gm)].map((m) => m[1]));
if (RU_TEAMS.size < 40) throw new Error(`Parsed only ${RU_TEAMS.size} RU teams from teams.ts`);

const wb = XLSX.read(fs.readFileSync(SRC), { type: "buffer" });
const num = (v) => (v === "" || v == null || !Number.isFinite(Number(v)) ? null : Number(v));
const str = (v) => String(v ?? "").trim();

function rowsOf(name) {
  const ws = wb.Sheets[name];
  if (!ws) return [];
  const rng = XLSX.utils.decode_range(ws["!ref"]);
  const range = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: rng.e });
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", range });
}

const PLACEHOLDER = /^Участник\s+\d+$/i;
const STAGE_LABELS = ["1/16", "1/8", "1/4", "1/2", "за 3", "финал"];
const stageOf = (label) => {
  const l = label.toLowerCase();
  return STAGE_LABELS.some((s) => l.includes(s)) ? label.trim() : null;
};

function parseStandingsNames() {
  const out = [];
  for (const r of rowsOf("ТАБЛИЦА")) {
    const rank = num(r[1]); const name = str(r[2]);
    if (rank === null || !name || PLACEHOLDER.test(name)) continue;
    out.push({ rank, name, total: num(r[3]) ?? 0, exact: num(r[4]) ?? 0, betPts: num(r[13]) ?? 0, playoffPts: num(r[14]) ?? 0 });
  }
  return out.sort((a, b) => a.rank - b.rank || b.total - a.total);
}

function parseParticipant(name) {
  const rows = rowsOf(name);
  const predictions = {}, placings = {}, bracket = [];
  const bets = { champion: "", finalist: "", third: "" };
  for (const r of rows) {
    const c1 = str(r[1]), c2 = str(r[2]);
    if (RU_TEAMS.has(c1) && RU_TEAMS.has(c2)) {
      const gh = num(r[3]), ga = num(r[4]);
      if (gh !== null && ga !== null) { predictions[`${c1}|${c2}`] = [gh, ga]; continue; }
    }
    if (/^[A-L]$/.test(c1) && RU_TEAMS.has(c2) && RU_TEAMS.has(str(r[3]))) {
      placings[c1] = [c2, str(r[3]), str(r[4])]; continue;
    }
    if (/^чемпион/i.test(c1)) { bets.champion = c2; continue; }
    if (/^финалист/i.test(c1)) { bets.finalist = c2; continue; }
    if (/^команда за 3/i.test(c1)) { bets.third = c2; continue; }
    const stage = stageOf(c1);
    if (stage && RU_TEAMS.has(c2)) {
      bracket.push({ stage, home: c2, away: str(r[3]), gh: num(r[4]), ga: num(r[5]), advances: str(r[6]) });
    }
  }
  return { name, predictions, placings, bracket, bets };
}

const standings = parseStandingsNames();
const participants = standings.map((s) => parseParticipant(s.name));

// ---- Verified transcription corrections (audited 2026-07-01) ----
// The master workbook has a handful of data-entry typos where a later-round /
// placing cell holds a team that is IMPOSSIBLE for that slot (didn't advance from
// the feeding tie / isn't in that group). Each fix below is confirmed against the
// participant's OWN bracket structure, scores and downstream rounds, so it only
// removes the typo — it never reinterprets a genuine (if illogical) blind pick.
// We patch here (not in the xlsx) so re-bakes stay correct; guards throw if a
// target row ever moves, so a correction can never silently miss.
function applyCorrections(list) {
  const P = (name) => { const p = list.find((x) => x.name === name); if (!p) throw new Error(`correction: no participant ${name}`); return p; };
  const tie = (p, stage, pred, ctx) => { const e = p.bracket.find((b) => b.stage.includes(stage) && pred(b)); if (!e) throw new Error(`correction: no ${ctx}`); return e; };
  // idempotent + drift-guarded: fix if the known typo is present, skip if already
  // corrected, throw if the value is something unexpected (source drifted).
  const fix = (e, field, wrong, right, ctx) => {
    if (e[field] === right) return;                 // already fixed upstream
    if (e[field] === wrong) { e[field] = right; return; }
    throw new Error(`correction drift: ${ctx} — expected "${wrong}"/"${right}", got "${e[field]}"`);
  };
  // Владимир П.: 1/8 "Бразилия — Кюрасао" → Кот-д'Ивуар (Кюрасао не выходил ни из одной его пары 1/16)
  fix(tie(P("Владимир П."), "1/8", (b) => b.home === "Бразилия", "ВП 1/8 Бразилия"), "away", "Кюрасао", "Кот-д'Ивуар", "ВП 1/8 Бразилия away");
  // Маршал: 1/8 "Турция — Бельгия" → Босния и Гер. (Турция не проходила; из его 1/16 вышла Босния)
  fix(tie(P("Маршал"), "1/8", (b) => b.away === "Бельгия", "Маршал 1/8 –Бельгия"), "home", "Турция", "Босния и Гер.", "Маршал 1/8 home");
  // Маршал: 1/8 "Аргентина — Египет" → США (Египет не проходил; из его 1/16 вышли США)
  fix(tie(P("Маршал"), "1/8", (b) => b.home === "Аргентина", "Маршал 1/8 Аргентина"), "away", "Египет", "США", "Маршал 1/8 away");
  // Денис: 1/8 "Колумбия — Испания" — «проходит»=Колумбия, но счёт 0:2 и весь путь ниже за Испанию
  fix(tie(P("Денис"), "1/8", (b) => b.home === "Колумбия" && b.away === "Испания", "Денис 1/8 Колумбия-Испания"), "advances", "Колумбия", "Испания", "Денис 1/8 adv");
  // Денис: 1/8 "Швейцария — Португалия" — «проходит»=Швейцария, но счёт 0:2 и весь путь ниже за Португалию
  fix(tie(P("Денис"), "1/8", (b) => b.home === "Швейцария" && b.away === "Португалия", "Денис 1/8 Швейцария-Португалия"), "advances", "Швейцария", "Португалия", "Денис 1/8 adv");
  // Денис: placing группы E, 3-е = Швеция (Швеция в группе F!) → Кот-д'Ивуар (его прогноз матчей E ставит Кот-д'Ивуар 3-м)
  const de = P("Денис"); if (!de.placings.E) throw new Error("Денис: нет placing E");
  if (de.placings.E[2] === "Швеция") de.placings.E[2] = "Кот-д'Ивуар";
  else if (de.placings.E[2] !== "Кот-д'Ивуар") throw new Error(`Денис E 3rd drift: ${de.placings.E[2]}`);
  // «Проходит»-опечатки в НИЧЕЙНЫХ парах: колонка победителя расходится с командами
  // следующих раундов И с финальными ставками участника (champion/finalist/3-е).
  // Команды сетки + ставки — два независимых сигнала — совпадают против одной ячейки adv,
  // поэтому правим adv к тому, кто реально идёт дальше по его же сетке.
  // Маршал (ставки Испания/Англия/Португалия): 1/2 "Англия 1:1 Португалия" проходит Англия (финалист), Португалия — 3-е
  fix(tie(P("Маршал"), "1/2", (b) => b.home === "Англия" && b.away === "Португалия", "Маршал 1/2 Англия-Португалия"), "advances", "Португалия", "Англия", "Маршал 1/2 adv");
  // Волк (ставки Испания/Франция/Австрия): 1/4 "Испания 2:2 Турция" проходит Испания (его чемпион по сетке)
  fix(tie(P("Волк"), "1/4", (b) => b.home === "Испания" && b.away === "Турция", "Волк 1/4 Испания-Турция"), "advances", "Турция", "Испания", "Волк 1/4 adv");
  // Волк: 1/2 "Франция 0:0 Австрия" проходит Франция (финалист), Австрия — 3-е
  fix(tie(P("Волк"), "1/2", (b) => b.home === "Франция" && b.away === "Австрия", "Волк 1/2 Франция-Австрия"), "advances", "Австрия", "Франция", "Волк 1/2 adv");
}
applyCorrections(participants);

// sanity
console.log("Участники:", participants.length);
for (let i = 0; i < participants.length; i++) {
  const p = participants[i], s = standings[i];
  console.log(`  ${s.name}: preds=${Object.keys(p.predictions).length} placings=${Object.keys(p.placings).length} bracket=${p.bracket.length} bets=[${p.bets.champion}/${p.bets.finalist}/${p.bets.third}]  (лист: всего=${s.total} точных=${s.exact} ставки=${s.betPts} ПО=${s.playoffPts})`);
}

const banner = `// AUTO-GENERATED by scripts/gen-predictions.mjs — do not edit by hand.
// Locked participant predictions baked from the pool workbook. All scoring is then
// computed in src/lib/scoring.ts from these + live API-Football results.
import type { SheetParticipant } from "./sources/sheet";

export const PARTICIPANTS: SheetParticipant[] = ${JSON.stringify(participants, null, 2)};
`;
fs.writeFileSync(OUT, banner, "utf8");
console.log("\nЗаписано:", OUT, `(${participants.length} участников)`);
