// Adapter: API-Football (api-sports.io) — the live football layer: real schedule
// (dates/times), venue cities, live/final scores, status, AND the official group
// standings (ranks + who advanced) that drive the scoring engine.
// Read server-side only (key from env, never sent to client).
import { ruFromApi, groupOf } from "../teams";

const BASE = "https://v3.football.api-sports.io";

function cfg() {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("API_FOOTBALL_KEY is not set");
  return {
    key,
    league: process.env.API_FOOTBALL_LEAGUE ?? "1",
    season: process.env.API_FOOTBALL_SEASON ?? "2026",
  };
}

export type ApiFixture = {
  id: number;
  homeRu: string | null;
  awayRu: string | null;
  homeEn: string;
  awayEn: string;
  group: string;        // derived from home team
  matchday: number;     // from "Group Stage - N"
  roundKey: "GROUP" | "R32" | "R16" | "QF" | "SF" | "THIRD" | "FINAL" | "OTHER";
  kickoff: string;      // ISO (UTC)
  timestamp: number;    // seconds
  cityEn: string;
  status: string;       // short, e.g. NS, 1H, HT, FT, PEN
  live: boolean;
  finished: boolean;
  gh: number | null;    // goals incl. extra time (pool score), excl. penalties
  ga: number | null;
  penHome: number | null; // penalty shootout score (knockouts only)
  penAway: number | null;
};

function roundKey(round: string): ApiFixture["roundKey"] {
  const r = round.toLowerCase();
  if (r.includes("group")) return "GROUP";
  if (r.includes("3rd") || r.includes("third")) return "THIRD";
  if (r.includes("semi")) return "SF";
  if (r.includes("quarter")) return "QF";
  if (r.includes("16")) return "R16";
  if (r.includes("32")) return "R32";
  if (r.includes("final")) return "FINAL";
  return "OTHER";
}

const LIVE = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"]);
const DONE = new Set(["FT", "AET", "PEN"]);

type RawFixture = {
  fixture: { id: number; date: string; timestamp: number; status: { short: string }; venue: { city: string | null } };
  teams: { home: { name: string }; away: { name: string } };
  goals: { home: number | null; away: number | null };
  score?: { penalty?: { home: number | null; away: number | null } };
  league: { round: string };
};

// ---- official group standings (ranks + advancement) ----
export type ApiStanding = {
  group: string;     // letter A..L
  rank: number;      // 1..4 within the group
  teamRu: string | null;
  teamEn: string;
  advanced: boolean; // true if the team qualified to the knockouts
};

type RawStandingRow = {
  rank: number;
  team: { name: string };
  group: string;        // e.g. "Group A"
  description: string | null;
};

/** Per-group official standings (12 group tables; ignores the cross-group thirds table). */
export async function getStandings(revalidate = 300): Promise<ApiStanding[]> {
  const { league, season } = cfg();
  const raw = (await apiGet(`/standings?league=${league}&season=${season}`, revalidate)) as Array<{
    league?: { standings?: RawStandingRow[][] };
  }>;
  const tables = raw[0]?.league?.standings ?? [];
  const out: ApiStanding[] = [];
  // ⚠️ API-Football sometimes returns a group's rows MORE THAN ONCE (seen mid-
  // tournament: groups H/I/J/K/L came back with each team duplicated). Left un-
  // deduped, sorting a group by rank puts the 1st-place team's DUPLICATE where the
  // 2nd/3rd should be, which corrupts the group-standing scoring (silently dropped
  // ~30-40 pts per participant). De-dup by (group, team), keeping the first row.
  const seen = new Set<string>();
  for (const table of tables) {
    for (const row of table) {
      const m = /^group\s+([a-l])$/i.exec(String(row.group).trim());
      if (!m) continue; // skip the "Group Stage" (best-thirds) cross-group table
      const group = m[1].toUpperCase();
      const key = `${group}|${row.team.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        group,
        rank: row.rank,
        teamEn: row.team.name,
        teamRu: ruFromApi(row.team.name),
        advanced: !!row.description,
      });
    }
  }
  return out;
}

async function apiGet(path: string, revalidate: number) {
  const { key } = cfg();
  const res = await fetch(`${BASE}${path}`, {
    headers: { "x-apisports-key": key },
    next: { revalidate },
  } as RequestInit);
  if (!res.ok) throw new Error(`API-Football ${path} → ${res.status}`);
  const json = await res.json();
  if (json.errors && Object.keys(json.errors).length) {
    throw new Error(`API-Football errors: ${JSON.stringify(json.errors)}`);
  }
  return json.response as unknown[];
}

/** All tournament fixtures, mapped to RU names + group/matchday. Revalidate
 *  faster while matches are live (30s) than the default (5 min). */
export async function getFixtures(revalidate = 300): Promise<ApiFixture[]> {
  const { league, season } = cfg();
  const raw = (await apiGet(`/fixtures?league=${league}&season=${season}`, revalidate)) as RawFixture[];
  return raw
    .map((f): ApiFixture => {
      const homeEn = f.teams.home.name, awayEn = f.teams.away.name;
      const homeRu = ruFromApi(homeEn), awayRu = ruFromApi(awayEn);
      const rk = roundKey(f.league.round);
      const mdMatch = String(f.league.round).match(/(\d+)\s*$/);
      const st = f.fixture.status.short as string;
      return {
        id: f.fixture.id,
        homeRu, awayRu, homeEn, awayEn,
        group: homeRu ? groupOf(homeRu) : "",
        matchday: rk === "GROUP" && mdMatch ? Number(mdMatch[1]) : 0,
        roundKey: rk,
        kickoff: f.fixture.date,
        timestamp: f.fixture.timestamp,
        cityEn: f.fixture.venue?.city ?? "",
        status: st,
        live: LIVE.has(st),
        finished: DONE.has(st),
        gh: f.goals.home,
        ga: f.goals.away,
        penHome: f.score?.penalty?.home ?? null,
        penAway: f.score?.penalty?.away ?? null,
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}
