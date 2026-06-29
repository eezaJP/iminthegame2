// Adapter: read the LIVE Google Sheet (the pool's scoring workbook) as the
// source of truth for participants' points, predictions, bracket and bets.
// We pull the whole workbook via the public export endpoint (one request, all
// sheets, with computed formula values, no API key) and parse it by CONTENT
// (team names / labels) rather than fixed row numbers, so small layout shifts
// between participant tabs don't break extraction.
import * as XLSX from "xlsx";
import { TEAMS } from "../teams";

const SHEET_ID = "10V3MLlNwVz1K1VCweE1eJz02HZLbOkZUG-sSqGfqgL4";
const EXPORT_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`;

const RU_TEAMS = new Set(Object.keys(TEAMS));
const num = (v: unknown): number | null =>
  v === "" || v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v);
const str = (v: unknown) => String(v ?? "").trim();

export type Score = [number, number];
export type GroupResult = {
  group: string; home: string; away: string;
  gh: number | null; ga: number | null; winner: string | null; penWinner: string | null;
};
export type PlayoffPick = {
  stage: string; home: string; away: string; gh: number | null; ga: number | null; advances: string;
};
export type SheetParticipant = {
  name: string;
  predictions: Record<string, Score>;        // "HomeRu|AwayRu" -> [gh, ga]
  placings: Record<string, [string, string, string]>; // group -> [1st, 2nd, 3rd]
  bracket: PlayoffPick[];
  bets: { champion: string; finalist: string; third: string };
};
export type Standing = {
  rank: number; name: string; total: number; exact: number; betPts: number; playoffPts: number;
};
export type SheetData = {
  standings: Standing[];
  participants: Record<string, SheetParticipant>;
  results: GroupResult[];
  fetchedAt: number;
  dayGains?: Record<string, number>; // points each participant gained in the last 24h
};

type Row = (string | number)[];

/** Read a sheet as a 2D array, forcing the origin to A1 (Google trims leading
 *  empty columns on export, which would otherwise drift every index by one). */
function rowsOf(wb: XLSX.WorkBook, name: string): Row[] {
  const ws = wb.Sheets[name];
  if (!ws) return [];
  const rng = XLSX.utils.decode_range(ws["!ref"] as string);
  const range = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: rng.e });
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", range }) as Row[];
}

// placeholder rows like "Участник 13" — excluded everywhere
const PLACEHOLDER = /^Участник\s+\d+$/i;

function parseStandings(wb: XLSX.WorkBook): Standing[] {
  const out: Standing[] = [];
  for (const r of rowsOf(wb, "ТАБЛИЦА")) {
    const rank = num(r[1]);
    const name = str(r[2]);
    if (rank === null || !name || PLACEHOLDER.test(name)) continue;
    out.push({
      rank, name,
      total: num(r[3]) ?? 0,
      exact: num(r[4]) ?? 0,
      betPts: num(r[13]) ?? 0,   // col N "ставки"
      playoffPts: num(r[14]) ?? 0, // col O "ПО"
    });
  }
  return out.sort((a, b) => a.rank - b.rank || b.total - a.total);
}

const STAGE_LABELS = ["1/16", "1/8", "1/4", "1/2", "за 3", "финал"];
function stageOf(label: string): string | null {
  const l = label.toLowerCase();
  if (!STAGE_LABELS.some((s) => l.includes(s))) return null;
  return label.trim();
}

function parseParticipant(wb: XLSX.WorkBook, name: string): SheetParticipant {
  const rows = rowsOf(wb, name);
  const predictions: Record<string, Score> = {};
  const placings: Record<string, [string, string, string]> = {};
  const bracket: PlayoffPick[] = [];
  const bets = { champion: "", finalist: "", third: "" };

  for (const r of rows) {
    const c1 = str(r[1]), c2 = str(r[2]);

    // group-match prediction: two known teams + numeric score in D/E
    if (RU_TEAMS.has(c1) && RU_TEAMS.has(c2)) {
      const gh = num(r[3]), ga = num(r[4]);
      if (gh !== null && ga !== null) { predictions[`${c1}|${c2}`] = [gh, ga]; continue; }
    }
    // group placing: single group letter A-L + three known teams
    if (/^[A-L]$/.test(c1) && RU_TEAMS.has(c2) && RU_TEAMS.has(str(r[3]))) {
      placings[c1] = [c2, str(r[3]), str(r[4])];
      continue;
    }
    // final bets — checked BEFORE the bracket, because "Финалист…" contains
    // "финал" and "Команда за 3-е место" contains "за 3", which would otherwise
    // be misread as playoff-stage rows.
    if (/^чемпион/i.test(c1)) { bets.champion = c2; continue; }
    if (/^финалист/i.test(c1)) { bets.finalist = c2; continue; }
    if (/^команда за 3/i.test(c1)) { bets.third = c2; continue; }
    // playoff pick: stage label in col B, teams in C/D, advances in G
    const stage = stageOf(c1);
    if (stage && RU_TEAMS.has(c2)) {
      bracket.push({
        stage, home: c2, away: str(r[3]),
        gh: num(r[4]), ga: num(r[5]), advances: str(r[6]),
      });
    }
  }
  return { name, predictions, placings, bracket, bets };
}

function parseResults(wb: XLSX.WorkBook): GroupResult[] {
  const out: GroupResult[] = [];
  for (const r of rowsOf(wb, "Результаты")) {
    const group = str(r[0]);
    const home = str(r[1]), away = str(r[2]);
    if (!/^[A-L]$/.test(group) || !RU_TEAMS.has(home) || !RU_TEAMS.has(away)) continue;
    out.push({
      group, home, away,
      gh: num(r[3]), ga: num(r[4]),
      winner: str(r[5]) && str(r[5]) !== "—" ? str(r[5]) : null,
      penWinner: str(r[6]) || null,
    });
  }
  return out;
}

/** Fetch + parse the whole workbook. `revalidate` controls Next.js ISR cache. */
export async function getSheetData(revalidate = 60): Promise<SheetData> {
  const res = await fetch(EXPORT_URL, { next: { revalidate } } as RequestInit);
  if (!res.ok) throw new Error(`Sheet export failed: ${res.status}`);
  const wb = XLSX.read(Buffer.from(await res.arrayBuffer()), { type: "buffer" });

  const standings = parseStandings(wb);
  const participants: Record<string, SheetParticipant> = {};
  for (const s of standings) participants[s.name] = parseParticipant(wb, s.name);

  return { standings, participants, results: parseResults(wb), fetchedAt: Date.now() };
}
