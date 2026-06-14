// Adapter: API-Football (api-sports.io) — the live football layer the sheet
// doesn't hold: real schedule (dates/times), venue cities, live/final scores,
// match status. Read server-side only (key from env, never sent to client).
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
  gh: number | null;
  ga: number | null;
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
  league: { round: string };
};

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
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}
