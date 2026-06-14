// Assembles the LIVE pool data (Google Sheet) + LIVE football (API-Football)
// into the exact shapes the existing components consume. This replaces the
// simulated lib/data.ts for the pages that have been wired to it.
//
// Honesty rule: anything that needs per-round HISTORY (movement between rounds)
// is returned as null and the components show a "pending" state — no fake numbers.
import { getSheetData, type Score, type SheetData } from "./sources/sheet";
import { getFixtures, type ApiFixture } from "./sources/apiFootball";
import { TEAMS, flagOf } from "./teams";
import type { Participant, TodayMatch } from "./types";
import type { PlayoffParticipant, PoRound, PoTeam, ChampionAliveItem } from "./playoff";

// API venue city → our host-city id (matches map.json ids 0-15).
const CITY_ID: Record<string, number> = {
  Vancouver: 0, Seattle: 1, "San Francisco Bay Area": 2, "Santa Clara": 2,
  "Los Angeles": 3, Inglewood: 3, Guadalajara: 4, "Mexico City": 5, Monterrey: 6,
  Houston: 7, Dallas: 8, "Kansas City": 9, Atlanta: 10, Miami: 11, Toronto: 12,
  Boston: 13, "New York New Jersey": 14, "East Rutherford": 14, Philadelphia: 15,
};
const CITY_RU: Record<number, string> = {
  0: "Ванкувер", 1: "Сиэтл", 2: "Сан-Франциско", 3: "Лос-Анджелес", 4: "Гвадалахара",
  5: "Мехико", 6: "Монтеррей", 7: "Хьюстон", 8: "Даллас", 9: "Канзас-Сити",
  10: "Атланта", 11: "Майами", 12: "Торонто", 13: "Бостон", 14: "Нью-Йорк", 15: "Филадельфия",
};

const MSK_MS = 3 * 3600 * 1000;
const mskParts = (iso: string) => {
  const m = new Date(new Date(iso).getTime() + MSK_MS).toISOString();
  return { date: m.slice(0, 10), time: m.slice(11, 16) };
};
const mskToday = () => new Date(Date.now() + MSK_MS).toISOString().slice(0, 10);

const gmPoints = ([ph, pa]: Score, [gh, ga]: Score) =>
  ph === gh && pa === ga ? 5 : Math.sign(ph - pa) === Math.sign(gh - ga) ? 2 : 0;

export type HomeData = Awaited<ReturnType<typeof getHomeData>>;

export async function getHomeData(revalidate = 60) {
  const [sheet, fixtures] = await Promise.all([getSheetData(revalidate), getFixtures(revalidate)]);

  // actual group results (from the sheet — the scoring source of truth)
  const results = new Map<string, Score>();
  for (const r of sheet.results) if (r.gh !== null && r.ga !== null) results.set(`${r.home}|${r.away}`, [r.gh, r.ga]);

  const predFor = (preds: Record<string, Score>, home: string, away: string): { ph: number; pa: number } | null => {
    const d = preds[`${home}|${away}`];
    if (d) return { ph: d[0], pa: d[1] };
    const rev = preds[`${away}|${home}`];
    if (rev) return { ph: rev[1], pa: rev[0] };
    return null;
  };

  // ---- participants (Participant[]) ----
  const players: Participant[] = sheet.standings.map((s, idx) => {
    const sp = sheet.participants[s.name];
    let groupMatches = 0, correctOutcomes = 0, nearMiss = 0, predictions = 0;
    for (const [key, pred] of Object.entries(sp?.predictions ?? {})) {
      predictions++;
      const res = results.get(key);
      if (!res) continue;
      const pts = gmPoints(pred, res);
      groupMatches += pts;
      if (pts >= 2) {
        correctOutcomes++;
        if (Math.abs(pred[0] - res[0]) + Math.abs(pred[1] - res[1]) === 1) nearMiss++;
      }
    }
    return {
      id: idx,
      name: s.name,
      avatarSeed: idx,
      champion: sp?.bets.champion || "",
      skill: 0,
      rank: s.rank,
      points: {
        groupMatches,
        groupStandings: 0,
        playoffMatches: s.playoffPts,
        squadBonus: 0,
        finalBets: s.betPts,
        total: s.total,
      },
      // no per-round history available yet → only start + now (movement = pending)
      history: [
        { label: "Старт", total: 0 },
        { label: "Сейчас", total: s.total },
      ],
      stats: { exactScores: s.exact, correctOutcomes, predictions, nearMiss, contrarian: 0 },
    };
  });

  // ---- today's matches (API schedule + league prediction split) ----
  const today = mskToday();
  const upcomingDays = [...new Set(fixtures.map((f) => mskParts(f.kickoff).date))].sort();
  const day = upcomingDays.includes(today) ? today : (upcomingDays.find((d) => d >= today) ?? today);

  const todayFixtures = fixtures
    .filter((f) => f.homeRu && f.awayRu && mskParts(f.kickoff).date === day)
    .sort((a, b) => a.timestamp - b.timestamp);

  const todayMatches: TodayMatch[] = todayFixtures.map((f) => {
    const home = f.homeRu!, away = f.awayRu!;
    let h = 0, d = 0, a = 0;
    const scoreCount: Record<string, number> = {};
    for (const s of sheet.standings) {
      const pick = predFor(sheet.participants[s.name]?.predictions ?? {}, home, away);
      if (!pick) continue;
      if (pick.ph > pick.pa) h++; else if (pick.ph < pick.pa) a++; else d++;
      const k = `${pick.ph}:${pick.pa}`;
      scoreCount[k] = (scoreCount[k] || 0) + 1;
    }
    const popularScore = Object.entries(scoreCount).sort((x, y) => y[1] - x[1])[0]?.[0] ?? "—";
    const fav = h >= a && h >= d ? home : a >= d ? away : null;
    const { time } = mskParts(f.kickoff);
    const cityId = CITY_ID[f.cityEn] ?? -1;
    const status = f.finished ? "finished" : f.live ? "live" : "upcoming";
    return {
      id: f.id.toString(),
      group: f.group,
      time,
      city: CITY_RU[cityId] ?? f.cityEn,
      home, away,
      homeFlag: flagOf(home), awayFlag: flagOf(away),
      dist: { home: h, draw: d, away: a },
      popularScore,
      potential: 75,
      impact: fav
        ? `Если ${fav} выиграет — заметно приблизится к выходу из группы.`
        : "Большинство ждёт ничью — группа останется открытой.",
      status, gh: f.gh, ga: f.ga, kickoff: f.timestamp * 1000,
      pens: f.penHome !== null && f.penAway !== null ? { h: f.penHome, a: f.penAway } : null,
    } as TodayMatch;
  });
  const potentialTotal = todayMatches.reduce((s, m) => s + m.potential, 0);

  // ---- next upcoming matches for the live countdown (real timestamps) ----
  const nowMs = Date.now();
  const nextMatches = fixtures
    .filter((f) => f.homeRu && f.awayRu && f.timestamp * 1000 > nowMs)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(0, 8)
    .map((f) => ({
      kickoff: f.timestamp * 1000, time: mskParts(f.kickoff).time,
      home: f.homeRu!, away: f.awayRu!, homeFlag: flagOf(f.homeRu!), awayFlag: flagOf(f.awayRu!),
    }));

  // ---- all group fixtures (slim, for the host map) ----
  const slimFixtures = fixtures
    .filter((f) => f.roundKey === "GROUP" && f.homeRu && f.awayRu)
    .map((f) => {
      const { date, time } = mskParts(f.kickoff);
      return {
        cityId: CITY_ID[f.cityEn] ?? -1,
        date, time, group: f.group,
        home: f.homeRu!, away: f.awayRu!,
        homeFlag: flagOf(f.homeRu!), awayFlag: flagOf(f.awayRu!),
      };
    });

  // ---- awards (leader + oracle real; round movement pending) ----
  const leader = players[0];
  const oracle = [...players].sort((a, b) => b.stats.exactScores - a.stats.exactScores || b.points.total - a.points.total)[0];
  const awards = {
    leader,
    oracle,
    roundLeader: null as { id: number; name: string; delta: number } | null, // pending: needs history
    var: null as { id: number; name: string; delta: number } | null,         // pending: needs history
  };

  // ---- facts ----
  // champion distribution across the league
  const champCount: Record<string, number> = {};
  for (const p of players) if (p.champion) champCount[p.champion] = (champCount[p.champion] || 0) + 1;
  const leagueChampions = Object.entries(champCount)
    .map(([team, count]) => ({ team, count, flag: flagOf(team) }))
    .sort((a, b) => b.count - a.count);

  // contrarian: who deviates most from the per-match majority today
  const majByMatch = todayMatches.map((m) =>
    m.dist.home >= m.dist.away && m.dist.home >= m.dist.draw ? "home" : m.dist.away >= m.dist.draw ? "away" : "draw"
  );
  let againstCrowd = { name: "—", count: 0 };
  for (const s of sheet.standings) {
    let n = 0;
    todayFixtures.forEach((f, i) => {
      const pick = predFor(sheet.participants[s.name]?.predictions ?? {}, f.homeRu!, f.awayRu!);
      if (!pick) return;
      const o = pick.ph > pick.pa ? "home" : pick.ph < pick.pa ? "away" : "draw";
      if (o !== majByMatch[i]) n++;
    });
    if (n > againstCrowd.count) againstCrowd = { name: s.name, count: n };
  }

  // almost-oracle: most near-misses (off by one goal) on played matches
  const almost = [...players].sort((a, b) => b.stats.nearMiss - a.stats.nearMiss)[0];

  // threat to the leader: nearest challenger who could overtake with today's max haul
  const maxToday = todayMatches.length * 5;
  const challenger = players.slice(1).find((p) => p.points.total + maxToday >= leader.points.total) ?? players[1];
  let threatCondition = "";
  if (challenger && todayFixtures[0]) {
    const f = todayFixtures[0];
    const pick = predFor(sheet.participants[challenger.name]?.predictions ?? {}, f.homeRu!, f.awayRu!);
    if (pick) {
      threatCondition = pick.ph === pick.pa
        ? `если ${f.homeRu} и ${f.awayRu} сыграют вничью`
        : `если ${pick.ph > pick.pa ? f.homeRu : f.awayRu} победит ${Math.max(pick.ph, pick.pa)}:${Math.min(pick.ph, pick.pa)}`;
    }
  }

  // rare pick: a played match whose actual winner was backed by the fewest (but >0)
  let rarePick: { team: string; count: number; total: number } | null = null;
  for (const r of sheet.results) {
    if (r.gh === null || r.ga === null || r.gh === r.ga) continue;
    const winner = r.gh > r.ga ? r.home : r.away;
    let correct = 0;
    for (const s of sheet.standings) {
      const pick = predFor(sheet.participants[s.name]?.predictions ?? {}, r.home, r.away);
      if (!pick) continue;
      const po = pick.ph > pick.pa ? r.home : pick.ph < pick.pa ? r.away : null;
      if (po === winner) correct++;
    }
    if (correct > 0 && (!rarePick || correct < rarePick.count)) {
      rarePick = { team: winner, count: correct, total: sheet.standings.length };
    }
  }

  const facts = {
    leagueChampions,
    againstCrowd,
    almostOracle: { name: almost?.name ?? "—", times: almost?.stats.nearMiss ?? 0 },
    threat: { name: challenger?.name ?? "—", condition: threatCondition },
    openPoints: { points: potentialTotal },
    majorityScore: { score: todayMatches.length ? mode(todayMatches.map((m) => m.popularScore)) : "—" },
    rarePick,
    // pending — need per-round history snapshots:
    comeback: null as { name: string; places: number; round: number } | null,
    underPressure: null as { name: string; places: number } | null,
    tableTurner: null as { match: string; positions: number } | null,
  };

  const stats = [
    { value: "72", label: "матча в группах" },
    { value: "48", label: "команд" },
    { value: "16", label: "городов" },
    { value: "12", label: "групп" },
  ];

  return {
    participantsCount: players.length,
    stats,
    players,
    todayMatches,
    nextMatches,
    potentialTotal,
    riser: facts.threat,
    awards,
    facts,
    fixtures: slimFixtures,
    spotlightDay: day,
  };
}

function mode(arr: string[]): string {
  const c: Record<string, number> = {};
  arr.forEach((x) => (c[x] = (c[x] || 0) + 1));
  return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
}

// ============================ GROUPS PAGE ============================
const GROUP_LETTERS = "ABCDEFGHIJKL".split("");

function predOf(preds: Record<string, Score>, home: string, away: string) {
  const d = preds[`${home}|${away}`];
  if (d) return { ph: d[0], pa: d[1] };
  const r = preds[`${away}|${home}`];
  if (r) return { ph: r[1], pa: r[0] };
  return null;
}

/** League prediction split for a fixture (from the participant sheets). */
function splitOf(sheet: SheetData, home: string, away: string) {
  let h = 0, d = 0, a = 0;
  const sc: Record<string, number> = {};
  for (const s of sheet.standings) {
    const p = predOf(sheet.participants[s.name]?.predictions ?? {}, home, away);
    if (!p) continue;
    if (p.ph > p.pa) h++; else if (p.ph < p.pa) a++; else d++;
    const k = `${p.ph}:${p.pa}`; sc[k] = (sc[k] || 0) + 1;
  }
  const score = Object.entries(sc).sort((x, y) => y[1] - x[1])[0]?.[0] ?? "—";
  return { home: h, draw: d, away: a, score };
}

export type GroupTableRow = { name: string; flag: string; played: number; gd: number; gf: number; points: number };
export type GroupMatchRow = {
  home: string; away: string; homeFlag: string; awayFlag: string;
  time: string; played: boolean; gh: number | null; ga: number | null;
  isToday: boolean; pred: { home: number; draw: number; away: number; score: string } | null;
};

function buildGroupTable(letter: string, fx: ApiFixture[]): GroupTableRow[] {
  const rows = new Map<string, GroupTableRow>();
  for (const [ru, t] of Object.entries(TEAMS)) {
    if (t.group === letter) rows.set(ru, { name: ru, flag: t.flag, played: 0, gd: 0, gf: 0, points: 0 });
  }
  for (const f of fx) {
    if (f.group !== letter || f.roundKey !== "GROUP" || !f.finished || f.gh === null || f.ga === null) continue;
    const h = rows.get(f.homeRu!), a = rows.get(f.awayRu!);
    if (!h || !a) continue;
    h.played++; a.played++;
    h.gf += f.gh; a.gf += f.ga;
    h.gd += f.gh - f.ga; a.gd += f.ga - f.gh;
    if (f.gh > f.ga) h.points += 3; else if (f.gh < f.ga) a.points += 3; else { h.points++; a.points++; }
  }
  return [...rows.values()].sort(
    (x, y) => y.points - x.points || y.gd - x.gd || y.gf - x.gf || x.name.localeCompare(y.name)
  );
}

export async function getGroupsData(revalidate = 60) {
  const [sheet, fixtures] = await Promise.all([getSheetData(revalidate), getFixtures(revalidate)]);
  const today = mskToday();

  const tables: Record<string, GroupTableRow[]> = {};
  for (const g of GROUP_LETTERS) tables[g] = buildGroupTable(g, fixtures);

  // per-group cards: table + matchdays (1..3) with scores / predictions
  const cards = GROUP_LETTERS.map((letter) => {
    const gfx = fixtures
      .filter((f) => f.group === letter && f.roundKey === "GROUP" && f.homeRu && f.awayRu)
      .sort((a, b) => a.timestamp - b.timestamp);
    const matchdays = [1, 2, 3].map((md) => {
      const ms = gfx.filter((f) => f.matchday === md);
      const matches: GroupMatchRow[] = ms.map((f) => {
        const { date, time } = mskParts(f.kickoff);
        const played = f.finished && f.gh !== null && f.ga !== null;
        return {
          home: f.homeRu!, away: f.awayRu!,
          homeFlag: flagOf(f.homeRu!), awayFlag: flagOf(f.awayRu!),
          time, played, gh: f.gh, ga: f.ga,
          isToday: date === today,
          pred: played ? null : splitOf(sheet, f.homeRu!, f.awayRu!),
        };
      });
      return { md, date: ms[0] ? mskParts(ms[0].kickoff).date : "", matches };
    });
    const played = gfx.filter((f) => f.finished).length;
    const hasToday = gfx.some((f) => mskParts(f.kickoff).date === today);
    const status =
      played === 6 ? { label: "Группа завершена", tone: "done" as const }
      : played === 0 ? { label: "Скоро старт", tone: "soon" as const }
      : hasToday ? { label: "Последний тур · сегодня", tone: "live" as const }
      : { label: `${Math.min(3, Math.ceil(played / 2))}/3 тура сыграно`, tone: "progress" as const };
    return { letter, table: tables[letter], status, matchdays, summary: groupSummary(letter, tables[letter], gfx) };
  });

  // insights (intrigue / decided)
  const insights = GROUP_LETTERS.map((letter) => insight(letter, tables[letter], fixtures));
  const intrigue = insights.filter((g) => g.open).sort((a, b) => b.openScore - a.openScore).slice(0, 4);
  const decided = insights.filter((g) => g.decided).sort((a, b) => b.gap23 - a.gap23).slice(0, 3);

  // third-place race
  const thirdRows = GROUP_LETTERS.map((g) => ({ ...tables[g][2], group: g }))
    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name));
  const thirds = thirdRows.map((r, i) => ({
    name: r.name, flag: r.flag, group: r.group, points: r.points, gd: r.gd, gf: r.gf,
    raceRank: i + 1, status: (i < 8 ? "in" : i < 10 ? "edge" : "out") as "in" | "edge" | "out",
  }));

  // today's matches (group stage)
  const todayFx = fixtures
    .filter((f) => f.roundKey === "GROUP" && f.homeRu && f.awayRu && mskParts(f.kickoff).date === today)
    .sort((a, b) => a.timestamp - b.timestamp);
  const todayMatches: TodayMatch[] = todayFx.map((f) => {
    const sp = splitOf(sheet, f.homeRu!, f.awayRu!);
    const fav = sp.home >= sp.away && sp.home >= sp.draw ? f.homeRu! : sp.away >= sp.draw ? f.awayRu! : null;
    return {
      id: f.id.toString(), group: f.group, time: mskParts(f.kickoff).time,
      city: CITY_RU[CITY_ID[f.cityEn] ?? -1] ?? f.cityEn,
      home: f.homeRu!, away: f.awayRu!, homeFlag: flagOf(f.homeRu!), awayFlag: flagOf(f.awayRu!),
      dist: { home: sp.home, draw: sp.draw, away: sp.away }, popularScore: sp.score,
      potential: 75,
      impact: fav ? `Если ${fav} выиграет — заметно приблизится к выходу из группы.`
        : "Большинство ждёт ничью — группа останется открытой.",
      status: f.finished ? "finished" : f.live ? "live" : "upcoming",
      gh: f.gh, ga: f.ga, kickoff: f.timestamp * 1000,
      pens: f.penHome !== null && f.penAway !== null ? { h: f.penHome, a: f.penAway } : null,
    };
  });

  const playedTotal = fixtures.filter((f) => f.roundKey === "GROUP" && f.finished).length;
  return {
    cards, intrigue, decided, thirds, todayMatches,
    potentialTotal: todayMatches.reduce((s, m) => s + m.potential, 0),
    summary: [
      { value: String(playedTotal), label: "сыграно" },
      { value: String(72 - playedTotal), label: "осталось" },
      { value: String(todayMatches.length), label: "сегодня" },
      { value: String(intrigue.length), label: "с интригой" },
    ],
  };
}

function insight(letter: string, table: GroupTableRow[], fx: ApiFixture[]) {
  const [a, b, c, d] = table;
  const gap23 = b.points - c.points;
  const gap24 = b.points - d.points;
  const next = fx.find((f) => f.group === letter && f.roundKey === "GROUP" && !f.finished && f.homeRu && f.awayRu);
  const contenders = [b, c, d.points >= b.points - 2 ? d : null].filter(Boolean).map((x) => x!.name);
  return {
    letter, open: gap23 <= 2, decided: gap23 >= 4, gap23,
    leader: a.name, second: b.name, third: c.name, last: d.name, contenders,
    keyMatch: next ? `${next.homeRu} — ${next.awayRu}` : null,
    openScore: (gap23 <= 1 ? 3 : gap23 <= 2 ? 2 : 0) + (gap24 <= 2 ? 1 : 0),
  };
}

function groupSummary(letter: string, table: GroupTableRow[], fx: ApiFixture[]): string {
  const g = insight(letter, table, fx);
  if (g.open && g.keyMatch) return `Всё решается в последнем туре: ${g.keyMatch}.`;
  if (g.decided) return `${g.leader} и ${g.second} впереди, ${g.last} почти выбыл.`;
  return `${g.leader} лидирует, борьба за второе место продолжается.`;
}

export type GroupsData = Awaited<ReturnType<typeof getGroupsData>>;
export type GroupInsightReal = ReturnType<typeof insight>;

// ============================ PLAYOFF PAGE ============================
const teamRef = (n: string): PoTeam => (n ? { n, f: flagOf(n) } : null);

function stageToRound(stage: string): { key: string; title: string } | null {
  const s = stage.toLowerCase();
  if (s.includes("1/16")) return { key: "r32", title: "1/16 финала" };
  if (s.includes("1/8")) return { key: "r16", title: "1/8 финала" };
  if (s.includes("1/4")) return { key: "qf", title: "1/4 финала" };
  if (s.includes("1/2")) return { key: "sf", title: "1/2 финала" };
  if (s.includes("за 3")) return { key: "third", title: "За 3-е место" };
  if (s.includes("финал")) return { key: "f", title: "Финал" };
  return null;
}

export async function getPlayoffData(revalidate = 60) {
  const [sheet, fixtures] = await Promise.all([getSheetData(revalidate), getFixtures(revalidate)]);

  // knockouts started once any non-group fixture is finished
  const started = fixtures.some((f) => f.roundKey !== "GROUP" && f.finished);

  // ---- per-participant blind brackets (real predictions) ----
  const ORDER = ["r32", "r16", "qf", "sf", "f"] as const;
  const TITLES: Record<string, string> = { r32: "1/16 финала", r16: "1/8 финала", qf: "1/4 финала", sf: "1/2 финала", f: "Финал" };
  const empty = { a: null, b: null } as const;

  const brackets: PlayoffParticipant[] = sheet.standings.map((s, idx) => {
    const sp = sheet.participants[s.name];
    const buckets: Record<string, PoRound["matches"]> = { r32: [], r16: [], qf: [], sf: [], f: [] };
    let thirdMatch: PlayoffParticipant["thirdMatch"] = { ...empty };
    for (const pick of sp?.bracket ?? []) {
      const r = stageToRound(pick.stage);
      if (!r) continue;
      const m = {
        a: teamRef(pick.home), b: teamRef(pick.away),
        scoreA: pick.gh, scoreB: pick.ga,
        winner: teamRef(pick.advances || (pick.gh !== null && pick.ga !== null ? (pick.gh >= pick.ga ? pick.home : pick.away) : "")),
      };
      if (r.key === "third") thirdMatch = m;
      else buckets[r.key].push(m);
    }
    const rounds: PoRound[] = ORDER.map((k) => ({ key: k, title: TITLES[k], matches: buckets[k] }));
    return {
      id: idx, name: s.name,
      champion: teamRef(sp?.bets.champion ?? ""),
      finalist: teamRef(sp?.bets.finalist ?? ""),
      third: teamRef(sp?.bets.third ?? ""),
      championStatus: "прогноз",
      aliveCount: 0, potential: 0, exactPlayoff: 0, burnedChampion: null,
      rounds, thirdMatch,
    };
  });

  // ---- champion distribution across the league ----
  const champMap = new Map<string, { count: number; participants: string[] }>();
  for (const s of sheet.standings) {
    const c = sheet.participants[s.name]?.bets.champion;
    if (!c) continue;
    if (!champMap.has(c)) champMap.set(c, { count: 0, participants: [] });
    const e = champMap.get(c)!; e.count++; e.participants.push(s.name);
  }
  const championAlive: ChampionAliveItem[] = [...champMap.entries()]
    .map(([team, e]) => ({ team, flag: flagOf(team), count: e.count, alive: true, status: "в игре", participants: e.participants }))
    .sort((a, b) => b.count - a.count);
  const favourite = championAlive[0] ?? null;

  return { started, brackets, championAlive, favourite };
}

export type PlayoffPageData = Awaited<ReturnType<typeof getPlayoffData>>;
