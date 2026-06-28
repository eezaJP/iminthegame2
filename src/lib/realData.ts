// Assembles the LIVE pool data (Google Sheet) + LIVE football (API-Football)
// into the exact shapes the existing components consume. This replaces the
// simulated lib/data.ts for the pages that have been wired to it.
//
// Honesty rule: anything that needs per-round HISTORY (movement between rounds)
// is returned as null and the components show a "pending" state — no fake numbers.
import { getSheetData, type Score, type SheetData } from "./sources/sheet";
import { getFixtures, type ApiFixture } from "./sources/apiFootball";
import { TEAMS, flagOf } from "./teams";
import { plural, ruDate } from "./utils";
import type { Participant, TodayMatch } from "./types";
import type { PlayoffParticipant, PoRound, PoMatch, PoTeam, ChampionAliveItem } from "./playoff";

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

// knockout round → label + max exact points per match (shared by home + playoff)
const KO_STAGE: Record<string, { label: string; pts: number }> = {
  R32: { label: "1/16 финала", pts: 8 }, R16: { label: "1/8 финала", pts: 12 },
  QF: { label: "1/4 финала", pts: 18 }, SF: { label: "1/2 финала", pts: 35 },
  THIRD: { label: "за 3-е место", pts: 28 }, FINAL: { label: "финал", pts: 55 },
};
const KO_ORDER = ["R32", "R16", "QF", "SF", "THIRD", "FINAL"];

const ROUND_DEPTH: Record<string, number> = { r32: 1, r16: 2, qf: 3, sf: 4, f: 5, third: 3 };

/** Per-participant map of team → furthest round they predicted it to win (blind bracket). */
function bracketDepths(sheet: SheetData): Map<string, number>[] {
  return sheet.standings.map((s) => {
    const depth = new Map<string, number>();
    for (const pick of sheet.participants[s.name]?.bracket ?? []) {
      const r = stageToRound(pick.stage);
      if (!r) continue;
      const d = ROUND_DEPTH[r.key] ?? 0;
      const adv = pick.advances || (pick.gh != null && pick.ga != null ? (pick.gh >= pick.ga ? pick.home : pick.away) : "");
      if (adv) depth.set(adv, Math.max(depth.get(adv) ?? 0, d));
    }
    return depth;
  });
}

/** League majority for a knockout tie — how many favour each side (by predicted bracket depth). */
function koMajority(depths: Map<string, number>[], home: string, away: string) {
  let h = 0, a = 0;
  for (const dm of depths) {
    const dh = dm.get(home) ?? 0, da = dm.get(away) ?? 0;
    if (dh > da) h++; else if (da > dh) a++;
  }
  return { home: h, draw: 0, away: a };
}

// API round → bracket round key (matches stageToRound output)
const RK2KEY: Record<string, string> = { R32: "r32", R16: "r16", QF: "qf", SF: "sf", THIRD: "third", FINAL: "f" };
const pairKeyOf = (a: string, b: string) => [a, b].sort().join("|");

type Guesser = { name: string; seed: number };

/** Map "roundKey|pairKey" → participants who predicted that exact pair (with avatar seed). */
function bracketPairGuessers(sheet: SheetData): Map<string, Guesser[]> {
  const map = new Map<string, Guesser[]>();
  sheet.standings.forEach((s, i) => {
    for (const pick of sheet.participants[s.name]?.bracket ?? []) {
      const r = stageToRound(pick.stage);
      if (!r || !pick.home || !pick.away) continue;
      const key = `${r.key}|${pairKeyOf(pick.home, pick.away)}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ name: s.name, seed: i });
    }
  });
  return map;
}

function pairGuessersFor(map: Map<string, Guesser[]>, roundKey: string, home: string, away: string): Guesser[] {
  return map.get(`${RK2KEY[roundKey] ?? ""}|${pairKeyOf(home, away)}`) ?? [];
}

/** Build a TodayMatch from a knockout fixture; dist = league bracket majority if provided. */
function koTodayMatch(f: ApiFixture, depths?: Map<string, number>[], pairMap?: Map<string, Guesser[]>): TodayMatch {
  const ko = KO_STAGE[f.roundKey];
  const { date, time } = mskParts(f.kickoff);
  const home = f.homeRu!, away = f.awayRu!;
  const guessers = pairMap ? pairGuessersFor(pairMap, f.roundKey, home, away) : undefined;
  return {
    id: f.id.toString(), group: f.group, isKnockout: true, stage: ko.label,
    pairGuessed: guessers?.length, pairGuessers: guessers,
    date, time, city: CITY_RU[CITY_ID[f.cityEn] ?? -1] ?? f.cityEn,
    home, away, homeFlag: flagOf(home), awayFlag: flagOf(away),
    dist: depths ? koMajority(depths, home, away) : { home: 0, draw: 0, away: 0 },
    popularScore: "—", potential: ko.pts,
    impact: "Матч на вылет — проигравший выбывает.",
    status: f.finished ? "finished" : f.live ? "live" : "upcoming",
    gh: f.gh, ga: f.ga, kickoff: f.timestamp * 1000,
    pens: f.penHome !== null && f.penAway !== null ? { h: f.penHome, a: f.penAway } : null,
  };
}

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

  // dense, tie-aware place: equal (points → exact → bets → playoff) share one
  // place; the next distinct group gets the next integer (1,1,2,3,3,4 — no gaps).
  players.sort((a, b) =>
    b.points.total - a.points.total ||
    b.stats.exactScores - a.stats.exactScores ||
    b.points.finalBets - a.points.finalBets ||
    b.points.playoffMatches - a.points.playoffMatches
  );
  let place = 0, prevKey = "";
  for (const p of players) {
    const key = `${p.points.total}|${p.stats.exactScores}|${p.points.finalBets}|${p.points.playoffMatches}`;
    if (key !== prevKey) { place++; prevKey = key; }
    p.rank = place;
  }

  // ---- today's matches (API schedule + league prediction split) ----
  const today = mskToday();
  const upcomingDays = [...new Set(fixtures.map((f) => mskParts(f.kickoff).date))].sort();
  const day = upcomingDays.includes(today) ? today : (upcomingDays.find((d) => d >= today) ?? today);

  const todayFixtures = fixtures
    .filter((f) => f.homeRu && f.awayRu && mskParts(f.kickoff).date === day)
    .sort((a, b) => a.timestamp - b.timestamp);

  const todayMatches: TodayMatch[] = todayFixtures.map((f) => {
    const home = f.homeRu!, away = f.awayRu!;
    const ko = f.roundKey !== "GROUP" ? KO_STAGE[f.roundKey] : null;
    let h = 0, d = 0, a = 0;
    const scoreCount: Record<string, number> = {};
    if (!ko) {
      for (const s of sheet.standings) {
        const pick = predFor(sheet.participants[s.name]?.predictions ?? {}, home, away);
        if (!pick) continue;
        if (pick.ph > pick.pa) h++; else if (pick.ph < pick.pa) a++; else d++;
        const k = `${pick.ph}:${pick.pa}`;
        scoreCount[k] = (scoreCount[k] || 0) + 1;
      }
    }
    const popularScore = ko ? "—" : (Object.entries(scoreCount).sort((x, y) => y[1] - x[1])[0]?.[0] ?? "—");
    const fav = h >= a && h >= d ? home : a >= d ? away : null;
    const { date, time } = mskParts(f.kickoff);
    const cityId = CITY_ID[f.cityEn] ?? -1;
    const status = f.finished ? "finished" : f.live ? "live" : "upcoming";
    return {
      id: f.id.toString(),
      group: f.group,
      isKnockout: !!ko,
      stage: ko?.label ?? "",
      date,
      time,
      city: CITY_RU[cityId] ?? f.cityEn,
      home, away,
      homeFlag: flagOf(home), awayFlag: flagOf(away),
      dist: { home: h, draw: d, away: a },
      popularScore,
      potential: ko ? ko.pts : 75,
      impact: ko
        ? "Матч на вылет — проигравший выбывает."
        : fav
          ? `Если ${fav} выиграет — заметно приблизится к выходу из группы.`
          : "Большинство ждёт ничью — группа останется открытой.",
      status, gh: f.gh, ga: f.ga, kickoff: f.timestamp * 1000,
      pens: f.penHome !== null && f.penAway !== null ? { h: f.penHome, a: f.penAway } : null,
    } as TodayMatch;
  });
  // league points "in play" badge = upcoming group matches only (not finished, not knockout)
  const potentialTotal = todayMatches
    .filter((m) => !m.isKnockout && m.status === "upcoming")
    .reduce((s, m) => s + m.potential, 0);

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

  // ======================= DASHBOARD STORY LAYER =======================
  // Derived blocks for the focused home dashboard: a dynamic "story of the day",
  // who can climb today, and short stories. All built from data already loaded —
  // no extra fetches, no new scoring logic.

  const finishedToday = todayFixtures.filter((f) => f.finished && f.gh !== null && f.ga !== null);
  const upcomingToday = todayFixtures.filter((f) => !f.finished);

  // per-participant day board: points earned today + potential still in play
  const dayBoard = players.map((p) => {
    const preds = sheet.participants[p.name]?.predictions ?? {};
    let gained = 0, potRemain = 0, exactToday = 0;
    for (const f of finishedToday) {
      const pick = predFor(preds, f.homeRu!, f.awayRu!);
      if (!pick) continue;
      const pts = gmPoints([pick.ph, pick.pa], [f.gh!, f.ga!]);
      gained += pts;
      if (pts === 5) exactToday++;
    }
    for (const f of upcomingToday) if (predFor(preds, f.homeRu!, f.awayRu!)) potRemain += 5;
    return {
      id: p.id, name: p.name, avatarSeed: p.avatarSeed, rank: p.rank,
      total: p.points.total, gained, potRemain, exactToday, ceiling: p.points.total + potRemain,
    };
  });

  // condition text from a participant's pick in the next upcoming match today
  const conditionFor = (name: string): string => {
    const preds = sheet.participants[name]?.predictions ?? {};
    for (const f of upcomingToday) {
      const pick = predFor(preds, f.homeRu!, f.awayRu!);
      if (!pick) continue;
      return pick.ph === pick.pa
        ? `если ${f.homeRu} и ${f.awayRu} сыграют вничью`
        : `если ${pick.ph > pick.pa ? f.homeRu : f.awayRu} победит ${Math.max(pick.ph, pick.pa)}:${Math.min(pick.ph, pick.pa)}`;
    }
    return "";
  };

  const matchCount = todayMatches.length;
  const nextDay = upcomingDays.find((d) => d > today) ?? null;
  const groupStageDone = fixtures.filter((f) => f.roundKey === "GROUP" && f.finished).length >= 72;

  // current knockout round (earliest with unplayed matches) + its full match list
  let currentRoundKey = "R32";
  for (const rk of KO_ORDER) {
    const rs = fixtures.filter((f) => f.roundKey === rk && f.homeRu && f.awayRu);
    if (rs.length && rs.some((f) => !f.finished)) { currentRoundKey = rk; break; }
  }
  const currentRoundLabel = KO_STAGE[currentRoundKey]?.label ?? "1/16 финала";
  const koDepths = bracketDepths(sheet);
  const koPairMap = bracketPairGuessers(sheet);
  const roundMatches = groupStageDone
    ? fixtures
        .filter((f) => f.roundKey === currentRoundKey && f.homeRu && f.awayRu)
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((f) => koTodayMatch(f, koDepths, koPairMap))
    : [];

  // home "matches" block: current knockout round in playoff phase, else today's games
  const usePlayoffRound = groupStageDone && roundMatches.length > 0;
  const homeMatches = usePlayoffRound ? roundMatches : todayMatches;
  const homeMatchesTitle = usePlayoffRound
    ? `Матчи ${currentRoundLabel}`
    : (day === today ? "Матчи сегодня" : "Ближайшие матчи");
  const homeMatchesHref = groupStageDone ? "/playoff" : "/groups";

  // ---- main story of the day (dynamic) ----
  let mainStory: {
    kind: "rest" | "leadChange" | "top3" | "gap";
    title: string; text: string; potential: number; matchCount: number;
  };
  if (groupStageDone) {
    // playoff phase — the group-stage "potential/climbers" framing no longer applies
    const rc = roundMatches.length;
    mainStory = {
      kind: "gap",
      title: "Плей-офф: цена ошибки максимальная",
      text: rc
        ? `Групповой этап позади. ${currentRoundLabel}: ${rc} ${plural(rc, "пара", "пары", "пар")} на вылет — в плей-офф очки кратно дороже, расклад ещё может перевернуться.`
        : "Групповой этап позади. Впереди матчи на вылет — там очки кратно дороже.",
      potential: 0, matchCount,
    };
  } else if (matchCount === 0) {
    mainStory = {
      kind: "rest",
      title: "Сегодня матчей нет",
      text: nextDay
        ? `Следующий игровой день — ${ruDate(nextDay)}. Прогнозы зафиксированы, ждём матчи.`
        : "Групповой этап завершается — впереди плей-офф.",
      potential: 0, matchCount: 0,
    };
  } else {
    const mc = `${matchCount} ${plural(matchCount, "матч", "матча", "матчей")}`;
    const challengers = dayBoard.filter((d) => d.rank > 1 && d.potRemain > 0 && d.ceiling >= leader.points.total);
    const top3Total = players[2]?.points.total ?? 0;
    const toTop3 = dayBoard.filter((d) => d.rank > 3 && d.potRemain > 0 && d.ceiling >= top3Total);
    if (challengers.length) {
      const names = challengers.slice(0, 2).map((c) => c.name);
      mainStory = {
        kind: "leadChange", title: "Сегодня может смениться лидер",
        text: `В игре ${mc} и ${potentialTotal} потенциальных очков. ${names.join(" и ")} ${names.length > 1 ? "могут" : "может"} обойти лидера.`,
        potential: potentialTotal, matchCount,
      };
    } else if (toTop3.length) {
      const names = toTop3.slice(0, 2).map((c) => c.name);
      mainStory = {
        kind: "top3", title: "Сегодня может измениться топ-3",
        text: `В игре ${mc} и ${potentialTotal} потенциальных очков. ${names.join(" и ")} ${names.length > 1 ? "могут" : "может"} приблизиться к лидерам.`,
        potential: potentialTotal, matchCount,
      };
    } else {
      const top = dayBoard.filter((d) => d.rank > 1 && d.potRemain > 0).sort((a, b) => b.potRemain - a.potRemain).slice(0, 2).map((c) => c.name);
      mainStory = {
        kind: "gap", title: "Сегодня — борьба за очки",
        text: `В игре ${mc} и ${potentialTotal} потенциальных очков.${top.length ? ` ${top.join(" и ")} ${top.length > 1 ? "могут" : "может"} сократить отставание.` : ""}`,
        potential: potentialTotal, matchCount,
      };
    }
  }

  // ---- who can climb today (top potential, with condition) ----
  const climbers = dayBoard
    .filter((d) => d.potRemain > 0 && d.rank > 1)
    .sort((a, b) => b.potRemain - a.potRemain || a.rank - b.rank)
    .slice(0, 4)
    .map((d) => {
      const idx = players.findIndex((p) => p.id === d.id);
      const above = players[idx - 1];
      const canPass = above && d.ceiling >= above.points.total;
      return {
        id: d.id, name: d.name, avatarSeed: d.avatarSeed, rank: d.rank, potential: d.potRemain,
        move: canPass ? `подняться на ${above.rank}-е место` : "сократить отставание",
        condition: conditionFor(d.name),
      };
    });

  // ---- stories of the day (max 4, best available) ----
  type Story = {
    kind: string; title: string; tone: "gold" | "green" | "sky" | "rose";
    name: string; id: number; text: string; metric: string; flag?: string; isTeam?: boolean;
  };
  const stories: Story[] = [];

  if (groupStageDone) {
    // ---- playoff stories from the blind brackets (group-day stories no longer apply) ----
    const fav = leagueChampions[0];
    if (fav) stories.push({ kind: "favorite", title: "Фаворит лиги", tone: "gold", name: fav.team, id: 0, flag: fav.flag, isTeam: true, text: `${fav.count} из ${players.length} поставили на этот трофей до старта.`, metric: `${fav.count} ${plural(fav.count, "голос", "голоса", "голосов")}` });
    const rare = [...leagueChampions].reverse().find((c) => c.count >= 1);
    if (rare && (!fav || rare.team !== fav.team)) {
      const fan = players.find((p) => p.champion === rare.team);
      if (fan) stories.push({ kind: "darkhorse", title: "Тёмная лошадка", tone: "sky", name: fan.name, id: fan.id, flag: rare.flag, text: `Верит в ${rare.team} — самый редкий выбор чемпиона в лиге.`, metric: rare.team });
    }
    if (fav) {
      const rebels = players.filter((p) => p.champion && p.champion !== fav.team);
      if (rebels[0]) stories.push({ kind: "against", title: "Против фаворита", tone: "rose", name: rebels[0].name, id: rebels[0].id, flag: flagOf(rebels[0].champion), text: `Не верит в ${fav.team} — поставил на ${rebels[0].champion}.`, metric: `${rebels.length} ${plural(rebels.length, "скептик", "скептика", "скептиков")}` });
    }
    const oracleP = [...players].sort((a, b) => b.stats.exactScores - a.stats.exactScores)[0];
    if (oracleP) stories.push({ kind: "oracle", title: "Оракул группового", tone: "green", name: oracleP.name, id: oracleP.id, text: "Больше всех точных счётов в группах — острый глаз перед плей-офф.", metric: `${oracleP.stats.exactScores} точных` });
  } else {
  const dayLeader = [...dayBoard].sort((a, b) => b.gained - a.gained || b.exactToday - a.exactToday)[0];
  if (dayLeader && dayLeader.gained > 0) {
    let exactMatch = "";
    const preds = sheet.participants[dayLeader.name]?.predictions ?? {};
    for (const f of finishedToday) {
      const pick = predFor(preds, f.homeRu!, f.awayRu!);
      if (pick && gmPoints([pick.ph, pick.pa], [f.gh!, f.ga!]) === 5) { exactMatch = `${f.homeRu} — ${f.awayRu}`; break; }
    }
    stories.push({
      kind: "leader", title: "Лидер дня", tone: "gold", name: dayLeader.name, id: dayLeader.id,
      text: exactMatch ? `Угадал точный счёт в матче ${exactMatch}.` : "Больше всех очков сегодня по сыгранным матчам.",
      metric: `+${dayLeader.gained} ${plural(dayLeader.gained, "очко", "очка", "очков")}`,
    });
  }

  if (facts.againstCrowd.count > 0) {
    const ac = players.find((p) => p.name === facts.againstCrowd.name);
    stories.push({
      kind: "contrarian", title: "Против большинства", tone: "sky", name: facts.againstCrowd.name, id: ac?.id ?? 0,
      text: `Чаще всех идёт против большинства сегодня — ${facts.againstCrowd.count} ${plural(facts.againstCrowd.count, "прогноз", "прогноза", "прогнозов")}.`,
      metric: "против большинства",
    });
  }

  // riskiest: someone who alone backs a particular scoreline in an upcoming match
  let risky: { name: string; id: number; match: string; score: string } | null = null;
  for (const f of upcomingToday) {
    const owners: Record<string, string[]> = {};
    for (const p of players) {
      const pick = predFor(sheet.participants[p.name]?.predictions ?? {}, f.homeRu!, f.awayRu!);
      if (!pick) continue;
      (owners[`${pick.ph}:${pick.pa}`] ??= []).push(p.name);
    }
    const solo = Object.entries(owners).find(([, o]) => o.length === 1);
    if (solo) {
      const owner = players.find((p) => p.name === solo[1][0])!;
      risky = { name: owner.name, id: owner.id, match: `${f.homeRu} — ${f.awayRu}`, score: solo[0] };
      break;
    }
  }
  if (risky) {
    stories.push({
      kind: "risky", title: "Самый рискованный", tone: "rose", name: risky.name, id: risky.id,
      text: `Единственный поставил счёт ${risky.score} в матче ${risky.match}.`, metric: "high risk",
    });
  }

  if (facts.threat.condition) {
    const th = players.find((p) => p.name === facts.threat.name);
    stories.push({
      kind: "threat", title: "Угроза лидеру", tone: "green", name: facts.threat.name, id: th?.id ?? 0,
      text: `Может обойти лидера сегодня, ${facts.threat.condition}.`, metric: "претендент",
    });
  } else if (facts.rarePick) {
    stories.push({
      kind: "rare", title: "Редкий прогноз", tone: "green", name: "", id: 0,
      text: `Только ${facts.rarePick.count} из ${facts.rarePick.total} поверили в ${facts.rarePick.team} — и забрали очки.`,
      metric: "редкий прогноз",
    });
  }
  }

  const playedTotal = sheet.results.filter((r) => r.gh !== null && r.ga !== null).length;

  // ======================= RATING PAGE LAYER =======================
  // Standings-focused derived blocks. Honest daily movement is computed from
  // matches that FINISHED today: rank-before-today (total minus today's gains)
  // vs rank-now. No per-round history is invented.
  const matchesLeft = Math.max(0, 72 - playedTotal);

  // rank a list densely (equal value → same place, next distinct value → +1)
  const denseRank = (rows: { id: number; v: number }[]) => {
    const sorted = [...rows].sort((a, b) => b.v - a.v);
    const map = new Map<number, number>();
    let place = 0;
    let prev: number | null = null;
    for (const r of sorted) {
      if (prev === null || r.v !== prev) { place++; prev = r.v; }
      map.set(r.id, place);
    }
    return map;
  };

  const beforeRank = denseRank(
    players.map((p) => {
      const db = dayBoard.find((d) => d.id === p.id);
      return { id: p.id, v: p.points.total - (db?.gained ?? 0) };
    })
  );
  const movement = players.map((p) => {
    const prev = beforeRank.get(p.id) ?? p.rank;
    return { id: p.id, name: p.name, avatarSeed: p.avatarSeed, prevRank: prev, nowRank: p.rank, delta: prev - p.rank };
  });
  // movers first (largest jump), then steady high-rankers, to always fill the panel
  const dayMovers = [...movement]
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.nowRank - b.nowRank)
    .slice(0, 5);
  const biggestJump = movement.filter((m) => m.delta > 0).sort((a, b) => b.delta - a.delta)[0] ?? null;

  // remaining reachable points per participant (group stage)
  const remainingPredicted = (name: string) => {
    const preds = sheet.participants[name]?.predictions ?? {};
    let n = 0;
    for (const f of fixtures) {
      if (f.roundKey !== "GROUP" || f.finished || !f.homeRu || !f.awayRu) continue;
      if (predFor(preds, f.homeRu, f.awayRu)) n++;
    }
    return n;
  };
  const potentials = players.map((p) => {
    const rem = remainingPredicted(p.name);
    return {
      id: p.id, name: p.name, avatarSeed: p.avatarSeed, rank: p.rank,
      total: p.points.total, champion: p.champion, championFlag: flagOf(p.champion),
      max: p.points.total + rem * 5,
    };
  });

  // best-by-category cards — SEASON/cumulative, deliberately distinct from the
  // home page's daily "Истории дня".
  const byExact = [...players].sort((a, b) => b.stats.exactScores - a.stats.exactScores || b.points.total - a.points.total)[0];
  const byOutcomes = [...players].sort((a, b) => b.stats.correctOutcomes - a.stats.correctOutcomes || b.points.total - a.points.total)[0];
  const byNear = [...players].sort((a, b) => b.stats.nearMiss - a.stats.nearMiss)[0];
  const byPotential = [...potentials].sort((a, b) => b.max - a.max)[0];
  const chaser = players[1] ?? null;
  // dark horse: backs the least popular champion in the league
  const rarestChampion = [...players]
    .filter((p) => p.champion)
    .sort((a, b) => (champCount[a.champion] ?? 99) - (champCount[b.champion] ?? 99) || b.points.total - a.points.total)[0];

  type CatCard = { key: string; title: string; tone: "gold" | "green" | "sky" | "rose"; icon: string; name: string; id: number; value: string; sub: string };
  const catCandidates: (CatCard | null)[] = [
    byExact && byExact.stats.exactScores > 0
      ? { key: "exact", title: "Больше всех точных счётов", tone: "gold", icon: "target", name: byExact.name, id: byExact.id, value: String(byExact.stats.exactScores), sub: plural(byExact.stats.exactScores, "точный счёт", "точных счёта", "точных счётов") }
      : null,
    byOutcomes && byOutcomes.stats.correctOutcomes > 0
      ? { key: "outcomes", title: "Точнее всех по исходам", tone: "green", icon: "check", name: byOutcomes.name, id: byOutcomes.id, value: String(byOutcomes.stats.correctOutcomes), sub: plural(byOutcomes.stats.correctOutcomes, "угаданный исход", "угаданных исхода", "угаданных исходов") }
      : null,
    biggestJump
      ? { key: "jump", title: "Самый большой рывок", tone: "green", icon: "trend", name: biggestJump.name, id: biggestJump.id, value: `+${biggestJump.delta}`, sub: `${plural(biggestJump.delta, "место", "места", "мест")} за день` }
      : null,
    byNear && byNear.stats.nearMiss > 0
      ? { key: "near", title: "Почти оракул", tone: "sky", icon: "crosshair", name: byNear.name, id: byNear.id, value: String(byNear.stats.nearMiss), sub: "раз мимо на один гол" }
      : null,
    byPotential
      ? { key: "potential", title: "Лидер по потенциалу", tone: "gold", icon: "flame", name: byPotential.name, id: byPotential.id, value: `${byPotential.max}`, sub: "очков максимум" }
      : null,
    rarestChampion
      ? { key: "darkhorse", title: "Тёмная лошадка", tone: "sky", icon: "gem", name: rarestChampion.name, id: rarestChampion.id, value: rarestChampion.champion, sub: "ставит на редкого чемпиона" }
      : null,
    chaser
      ? { key: "chaser", title: "Главный претендент", tone: "rose", icon: "swords", name: chaser.name, id: chaser.id, value: `−${(players[0]?.points.total ?? 0) - chaser.points.total}`, sub: "до лидера" }
      : null,
  ];
  const bestByCategory = catCandidates.filter((c): c is CatCard => c !== null).slice(0, 6);

  // overtake scenarios — pairwise, with a checklist of today's conditions
  const overtakeScenarios = climbers.slice(0, 2).map((c) => {
    const preds = sheet.participants[c.name]?.predictions ?? {};
    const conditions: string[] = [];
    for (const f of upcomingToday) {
      const pick = predFor(preds, f.homeRu!, f.awayRu!);
      if (!pick) continue;
      conditions.push(
        pick.ph === pick.pa
          ? `${f.homeRu} и ${f.awayRu} сыграют вничью`
          : `${pick.ph > pick.pa ? f.homeRu : f.awayRu} обыграет ${pick.ph > pick.pa ? f.awayRu : f.homeRu} ${Math.max(pick.ph, pick.pa)}:${Math.min(pick.ph, pick.pa)}`
      );
      if (conditions.length >= 3) break;
    }
    const idx = players.findIndex((p) => p.id === c.id);
    const above = players[idx - 1];
    return {
      id: c.id, name: c.name, avatarSeed: c.avatarSeed,
      target: above?.name ?? "лидера", place: above?.rank ?? 1,
      conditions, maxGain: c.potential,
    };
  });

  // tournament phase — group stage vs knockouts (drives the rating hero + labels)
  const groupDone = playedTotal >= 72;
  const koAll = fixtures.filter((f) => f.roundKey !== "GROUP" && f.roundKey !== "OTHER");
  const koPlayed = koAll.filter((f) => f.finished).length;
  const KO_TOTAL = 32; // 16 + 8 + 4 + 2 + 1 (за 3-е) + 1 (финал)
  const RK_LABEL: Record<string, string> = { R32: "1/16 финала", R16: "1/8 финала", QF: "1/4 финала", SF: "1/2 финала", FINAL: "финал" };
  let roundLabel = "1/16 финала";
  for (const rk of ["R32", "R16", "QF", "SF", "FINAL"]) {
    const rs = koAll.filter((f) => f.roundKey === rk);
    if (rs.length && rs.some((f) => !f.finished)) { roundLabel = RK_LABEL[rk]; break; }
  }
  // theoretical max points still in play in the playoff (match + squad bonus + final bets)
  const playoffPotential =
    (16 * 8 + 8 * 12 + 4 * 18 + 2 * 35 + 28 + 55) + // perfect match points (449)
    (16 * 2 + 8 * 3 + 4 * 5 + 2 * 8) +              // squad bonus (92)
    (55 + 15 + 8);                                  // final bets (78) → 619

  const rating = {
    phase: groupDone ? ("playoff" as const) : ("group" as const),
    roundLabel,
    koMatchesLeft: Math.max(0, KO_TOTAL - koPlayed),
    playoffPotential,
    matchesLeft,
    seasonPotential: matchesLeft * 5,
    movement,
    dayMovers,
    overtakeScenarios,
    bestByCategory,
    potentials,
  };

  // whole-tournament match count: 72 group + 32 knockout (16+8+4+2+1+1) = 104
  const totalMatches = 72 + KO_TOTAL;
  const totalPlayed = playedTotal + koPlayed;
  const stats = [
    { value: String(totalMatches), label: "матча" },
    { value: "48", label: "команд" },
    { value: "16", label: "городов" },
    { value: "12", label: "групп" },
  ];

  return {
    participantsCount: players.length,
    stats,
    players,
    todayMatches,
    homeMatches,
    homeMatchesTitle,
    homeMatchesHref,
    nextMatches,
    potentialTotal,
    riser: facts.threat,
    awards,
    facts,
    fixtures: slimFixtures,
    spotlightDay: day,
    matchesAreToday: day === today,
    nextDay,
    playedTotal,
    totalPlayed,
    totalMatches,
    mainStory,
    climbers,
    stories: stories.slice(0, 4),
    rating,
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
  const done = fixtures.filter((f) => f.roundKey === "GROUP" && f.finished).length >= 72;

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
    raceRank: i + 1,
    status: (done ? (i < 8 ? "in" : "out") : i < 8 ? "in" : i < 10 ? "edge" : "out") as "in" | "edge" | "out",
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
    done, cards, intrigue, decided, thirds, todayMatches,
    potentialTotal: todayMatches.reduce((s, m) => s + m.potential, 0),
    summary: done
      ? [
          { value: "72", label: "матча сыграно" },
          { value: "12", label: "групп" },
          { value: "32", label: "в плей-офф" },
          { value: "8", label: "лучших третьих" },
        ]
      : [
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

  // ---- REAL bracket from live knockout fixtures (TBD until knockouts start) ----
  const RK_KEY: Record<string, string> = { R32: "r32", R16: "r16", QF: "qf", SF: "sf", FINAL: "f" };
  const realBuckets: Record<string, PoMatch[]> = { r32: [], r16: [], qf: [], sf: [], f: [] };
  let realThird: PoMatch = { a: null, b: null };
  const koFixtures = fixtures
    .filter((f) => f.roundKey !== "GROUP" && f.roundKey !== "OTHER")
    .sort((a, b) => a.timestamp - b.timestamp);
  for (const f of koFixtures) {
    const a = teamRef(f.homeRu ?? "");
    const b = teamRef(f.awayRu ?? "");
    let winner: PoTeam = null;
    if (f.finished && f.gh !== null && f.ga !== null) {
      if (f.gh > f.ga) winner = a;
      else if (f.ga > f.gh) winner = b;
      else if (f.penHome !== null && f.penAway !== null) winner = f.penHome > f.penAway ? a : b;
    }
    const m: PoMatch = {
      a, b,
      scoreA: f.finished ? f.gh : null,
      scoreB: f.finished ? f.ga : null,
      winner: winner ?? undefined,
      pens: f.penHome !== null && f.penAway !== null,
      played: f.finished,
    };
    if (f.roundKey === "THIRD") { realThird = m; continue; }
    const key = RK_KEY[f.roundKey];
    if (key) realBuckets[key].push(m);
  }
  // full bracket skeleton — every slot exists; real pairs drop in as the API
  // resolves them (1/16 fills first, third-place qualifiers slot in last).
  const PO_COUNTS: Record<string, number> = { r32: 16, r16: 8, qf: 4, sf: 2, f: 1 };
  const blankMatch = (): PoMatch => ({ a: null, b: null, scoreA: null, scoreB: null, winner: undefined, played: false });
  const realRounds: PoRound[] = ORDER.map((k) => {
    const matches = [...realBuckets[k]];
    while (matches.length < PO_COUNTS[k]) matches.push(blankMatch());
    return { key: k, title: TITLES[k], matches: matches.slice(0, PO_COUNTS[k]) };
  });
  const real = {
    started,
    knownMatches: koFixtures.length,
    rounds: realRounds,
    third: realThird.a || realThird.b ? realThird : blankMatch(),
    champion: realBuckets.f[0]?.winner ?? null,
  };

  // ---- today's (or next) knockout matches, for the "Матчи плей-офф" section ----
  const today = mskToday();
  const koSchedule = fixtures.filter((f) => KO_STAGE[f.roundKey] && f.homeRu && f.awayRu);
  const koDays = [...new Set(koSchedule.map((f) => mskParts(f.kickoff).date))].sort();
  const koDay = koDays.includes(today) ? today : (koDays.find((d) => d >= today) ?? null);
  const koDepths = bracketDepths(sheet);
  const koPairMap = bracketPairGuessers(sheet);
  const todayMatches: TodayMatch[] = !koDay ? [] : koSchedule
    .filter((f) => mskParts(f.kickoff).date === koDay)
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((f) => koTodayMatch(f, koDepths, koPairMap));

  return {
    started, brackets, championAlive, favourite, real,
    todayMatches,
    matchesAreToday: koDay === today,
    dayLabel: koDay ? ruDate(koDay) : "",
  };
}

export type PlayoffPageData = Awaited<ReturnType<typeof getPlayoffData>>;
