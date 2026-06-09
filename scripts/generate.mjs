// Deterministic data generator for the WC2026 prediction-pool dashboard.
// Produces src/data/tournament.json (teams, groups, 72 fixtures, host cities,
// playoff skeleton) and src/data/demo.json (15 participants with baked points,
// per-round history and stats, plus partially-played results).
//
// Everything is seeded — no Math.random at runtime — so SSR output is stable.
// Run with: node scripts/generate.mjs

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "src", "data");
mkdirSync(OUT, { recursive: true });

// ---------- seeded RNG (mulberry32) ----------
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- teams & groups (codes for flagcdn.com) ----------
// [name, flagcode, strength 0..1]  strength only used to simulate demo results
const GROUPS = {
  A: [["Мексика","mx",0.74],["ЮАР","za",0.55],["Ю. Корея","kr",0.66],["Чехия","cz",0.63]],
  B: [["Канада","ca",0.68],["Босния и Гер.","ba",0.58],["Катар","qa",0.5],["Швейцария","ch",0.71]],
  C: [["Бразилия","br",0.93],["Марокко","ma",0.74],["Гаити","ht",0.42],["Шотландия","gb-sct",0.61]],
  D: [["США","us",0.72],["Парагвай","py",0.6],["Австралия","au",0.62],["Турция","tr",0.7]],
  E: [["Германия","de",0.88],["Кюрасао","cw",0.4],["Кот-д’Ивуар","ci",0.66],["Эквадор","ec",0.67]],
  F: [["Нидерланды","nl",0.85],["Япония","jp",0.7],["Швеция","se",0.64],["Тунис","tn",0.55]],
  G: [["Бельгия","be",0.82],["Египет","eg",0.62],["Иран","ir",0.6],["Новая Зеландия","nz",0.45]],
  H: [["Испания","es",0.9],["Кабо-Верде","cv",0.43],["С. Аравия","sa",0.52],["Уругвай","uy",0.79]],
  I: [["Франция","fr",0.92],["Сенегал","sn",0.72],["Ирак","iq",0.5],["Норвегия","no",0.71]],
  J: [["Аргентина","ar",0.94],["Алжир","dz",0.63],["Австрия","at",0.68],["Иордания","jo",0.46]],
  K: [["Португалия","pt",0.88],["ДР Конго","cd",0.55],["Узбекистан","uz",0.53],["Колумбия","co",0.76]],
  L: [["Англия","gb-eng",0.89],["Хорватия","hr",0.78],["Гана","gh",0.6],["Панама","pa",0.47]],
};
const GROUP_LETTERS = Object.keys(GROUPS);

// canonical double round-robin order (verified against the Excel pairings)
const PAIR_PATTERN = [[0,1],[2,3],[3,0],[1,2],[3,1],[0,2]];

// ---------- host cities (x/y placed on the stylized NA map, viewBox 1000x640) ----------
const HOST_CITIES = [
  ["Ванкувер","CAN",112,150],["Сиэтл","USA",132,182],["Сан-Франциско","USA",96,300],
  ["Лос-Анджелес","USA",150,346],["Гвадалахара","MEX",262,486],["Мехико","MEX",312,512],
  ["Монтеррей","MEX",330,440],["Хьюстон","USA",398,420],["Даллас","USA",384,366],
  ["Канзас-Сити","USA",452,312],["Атланта","USA",560,372],["Майами","USA",624,470],
  ["Торонто","CAN",582,236],["Бостон","USA",672,236],["Нью-Йорк","USA",652,264],
  ["Филадельфия","USA",636,282],
].map(([city,country,x,y],i)=>({ id:i, city, country, x, y }));

// ---------- build teams + 72 group fixtures ----------
const teams = [];
const teamId = {};
for (const g of GROUP_LETTERS) {
  GROUPS[g].forEach(([name,flag,strength]) => {
    const id = teams.length;
    teamId[name] = id;
    teams.push({ id, name, flag, group: g, strength });
  });
}

// matchday windows (MSK). 2 groups share a calendar day; 2 matches per group/day.
const MD_START = ["2026-06-11","2026-06-18","2026-06-24"]; // round 1/2/3 first day
const KICKOFFS = ["19:00","22:00","01:00","04:00"];
function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0,10);
}

const matches = [];
GROUP_LETTERS.forEach((g, gi) => {
  const gt = GROUPS[g];
  PAIR_PATTERN.forEach(([a,b], mi) => {
    const md = Math.floor(mi / 2);          // 0,0,1,1,2,2
    const slot = mi % 2;                    // two matches per matchday
    const date = addDays(MD_START[md], Math.floor(gi / 2)); // 2 groups per day
    const time = KICKOFFS[(gi % 2) * 2 + slot];
    const city = HOST_CITIES[(gi * 6 + mi) % HOST_CITIES.length];
    matches.push({
      id: `${g}${mi+1}`,
      group: g,
      matchday: md + 1,
      date,
      time,
      cityId: city.id,
      city: city.city,
      country: city.country,
      home: gt[a][0],
      away: gt[b][0],
      homeFlag: gt[a][1],
      awayFlag: gt[b][1],
      goalsHome: null,
      goalsAway: null,
    });
  });
});

// ---------- simulate actual results for matchdays 1 & 2 (demo "live" state) ----------
const sim = rng(20260611);
function simulateScore(hs, as_) {
  // expected goals from strength diff
  const eh = 1.15 + (hs - as_) * 2.1 + 0.12;
  const ea = 1.15 + (as_ - hs) * 2.1;
  const g = (lam) => {
    let n = 0, p = Math.exp(-Math.max(0.18, lam)), x = sim();
    while (x > p && n < 6) { x -= p; n++; p *= Math.max(0.18, lam) / n; }
    return n;
  };
  return [g(eh), g(ea)];
}
const PLAYED_THROUGH_MD = 2; // matchdays 1-2 played, MD3 + playoff upcoming
for (const m of matches) {
  if (m.matchday <= PLAYED_THROUGH_MD) {
    const h = teams[teamId[m.home]].strength;
    const a = teams[teamId[m.away]].strength;
    const [gh, ga] = simulateScore(h, a);
    m.goalsHome = gh;
    m.goalsAway = ga;
  }
}

// ---------- playoff skeleton (stage list with slot counts) ----------
const PLAYOFF_STAGES = [
  { key: "r32", title: "1/16 финала", matches: 16, win: 3, exact: 8, bonus: 0 },
  { key: "r16", title: "1/8 финала", matches: 8, win: 5, exact: 12, bonus: 2 },
  { key: "qf",  title: "1/4 финала", matches: 4, win: 8, exact: 18, bonus: 3 },
  { key: "sf",  title: "1/2 финала", matches: 2, win: 15, exact: 35, bonus: 5 },
  { key: "tp",  title: "Матч за 3-е место", matches: 1, win: 12, exact: 28, bonus: 0 },
  { key: "f",   title: "Финал", matches: 1, win: 25, exact: 55, bonus: 8 },
];

// consensus favourites to seed the playoff preview bracket (top-2 by strength/group)
const favourites = GROUP_LETTERS.map((g) => {
  const sorted = [...GROUPS[g]].sort((x, y) => y[2] - x[2]);
  return { group: g, first: sorted[0], second: sorted[1] };
});

// ---------- predicted knockout bracket (round of 16 → final), seeded by strength ----------
function buildBracket() {
  const br = rng(778899);
  const T = (t, group) => ({ name: t[0], flag: t[1], s: t[2], group });
  const winners = favourites.map((f) => T(f.first, f.group));
  const runners = favourites.map((f) => T(f.second, f.group)).sort((a, b) => b.s - a.s);
  // 12 group winners + 4 best runners-up = 16
  const pool = [...winners, ...runners.slice(0, 4)].sort((a, b) => b.s - a.s);
  const seedOrder = [1, 16, 8, 9, 5, 12, 4, 13, 3, 14, 6, 11, 7, 10, 2, 15];

  const play = (a, b) => {
    // higher strength favoured, with seeded noise
    const pa = a.s + (br() - 0.5) * 0.5;
    const pb = b.s + (br() - 0.5) * 0.5;
    const aWin = pa >= pb;
    const hi = Math.max(1, Math.round(1 + br() * 2));
    const lo = Math.round(br() * Math.max(0, hi - 1));
    return {
      a, b,
      scoreA: aWin ? hi : lo,
      scoreB: aWin ? lo : hi,
      winner: aWin ? a : b,
      loser: aWin ? b : a,
    };
  };

  const r16 = [];
  for (let i = 0; i < 16; i += 2) {
    r16.push(play(pool[seedOrder[i] - 1], pool[seedOrder[i + 1] - 1]));
  }
  const advance = (round) => {
    const next = [];
    for (let i = 0; i < round.length; i += 2) {
      next.push(play(round[i].winner, round[i + 1].winner));
    }
    return next;
  };
  const qf = advance(r16);
  const sf = advance(qf);
  const final = advance(sf);
  const third = [play(sf[0].loser, sf[1].loser)];

  return {
    rounds: [
      { key: "r16", title: "1/8 финала", matches: r16 },
      { key: "qf", title: "1/4 финала", matches: qf },
      { key: "sf", title: "1/2 финала", matches: sf },
      { key: "f", title: "Финал", matches: final },
    ],
    third: third[0],
    champion: final[0].winner,
  };
}
const bracketPreview = buildBracket();

const tournament = {
  meta: {
    name: "Чемпионат мира — 2026",
    hosts: ["США", "Канада", "Мексика"],
    start: "2026-06-11T19:00:00+03:00",
    tz: "МСК",
    participants: 15,
    playedThroughMatchday: PLAYED_THROUGH_MD,
  },
  groups: GROUP_LETTERS.map((g) => ({
    letter: g,
    teams: GROUPS[g].map(([name, flag]) => ({ name, flag })),
  })),
  teams,
  matches,
  hostCities: HOST_CITIES,
  playoffStages: PLAYOFF_STAGES,
  favourites,
  bracketPreview,
};

// ================= DEMO LEAGUE (15 participants) =================
// Demo clock: a mid-tournament day so every homepage block has live data at once —
// two finished rounds (leaderboard / movement / facts) AND matches "today".
const DEMO_TODAY = "2026-06-24"; // group A/B matchday 3
const NAMES = Array.from({ length: 15 }, (_, i) => `Участник ${i + 1}`);
const CHAMPS = ["Аргентина", "Франция", "Испания", "Бразилия", "Англия", "Германия", "Португалия"];
const FLAG_OF = new Map(teams.map((t) => [t.name, t.flag]));

const todayMatches = matches.filter((m) => m.date === DEMO_TODAY);

// deterministic predicted scoreline for (participant, match) — used for "today" distributions
function pickFor(idx, m, mi) {
  const rr = rng(50000 + idx * 131 + mi * 17);
  const h = teams[teamId[m.home]].strength;
  const a = teams[teamId[m.away]].strength;
  const ph = Math.max(0, Math.round(1.1 + (h - a) * 1.9 + (rr() - 0.5) * 1.7));
  const pa = Math.max(0, Math.round(1.1 + (a - h) * 1.9 + (rr() - 0.5) * 1.7));
  return { ph, pa, outcome: ph > pa ? "home" : ph < pa ? "away" : "draw" };
}
// matrix[participant][todayMatchIndex] = pick
const todayPickMatrix = NAMES.map((_, idx) => todayMatches.map((m, mi) => pickFor(idx, m, mi)));

const participants = NAMES.map((name, idx) => {
  const r = rng(1000 + idx * 7);
  const skill = 0.3 + r() * 0.46; // 0.30..0.76

  const byMatchday = { 1: 0, 2: 0 };
  let exactScores = 0, correctOutcomes = 0, predictions = 0, nearMiss = 0;

  for (const m of matches) {
    if (m.matchday > PLAYED_THROUGH_MD) continue;
    predictions++;
    const rr = r();
    let ph, pa;
    if (rr < skill * 0.2) {
      ph = m.goalsHome; pa = m.goalsAway;
    } else if (rr < skill) {
      const realDiff = Math.sign(m.goalsHome - m.goalsAway);
      do { ph = Math.floor(r() * 4); pa = Math.floor(r() * 4); } while (Math.sign(ph - pa) !== realDiff);
    } else {
      ph = Math.floor(r() * 4); pa = Math.floor(r() * 4);
    }
    let pts = 0;
    if (ph === m.goalsHome && pa === m.goalsAway) { pts = 5; exactScores++; correctOutcomes++; }
    else if (Math.sign(ph - pa) === Math.sign(m.goalsHome - m.goalsAway)) {
      pts = 2; correctOutcomes++;
      if (Math.abs(ph - m.goalsHome) + Math.abs(pa - m.goalsAway) === 1) nearMiss++;
    }
    byMatchday[m.matchday] += pts;
  }

  const groupMatchPts = byMatchday[1] + byMatchday[2];
  const standingsPts = Math.round(skill * 20 + r() * 7);
  const total = groupMatchPts + standingsPts;

  return {
    id: idx,
    name,
    avatarSeed: idx,
    champion: CHAMPS[Math.floor(r() * CHAMPS.length)],
    skill: Math.round(skill * 100),
    points: { groupMatches: groupMatchPts, groupStandings: standingsPts, playoffMatches: 0, squadBonus: 0, finalBets: 0, total },
    history: [
      { label: "Старт", total: 0 },
      { label: "Тур 1", total: byMatchday[1] },
      { label: "Тур 2", total: byMatchday[1] + byMatchday[2] },
      { label: "Сейчас", total },
    ],
    stats: { exactScores, correctOutcomes, predictions, nearMiss, contrarian: 0 },
  };
});

// ===================== PLAYOFF (32 teams: 1/16 → финал; real played through 1/4) =====================
const STAGE_LABEL = { 1: "1/16 финала", 2: "1/8 финала", 3: "1/4 финала", 4: "1/2 финала", 5: "финал" };
const slimT = (t) => (t ? { n: t.n, f: t.f } : null);
// standard single-elimination seeding order for n (power of 2)
function buildSeedOrder(n) {
  let s = [1, 2];
  while (s.length < n) {
    const m = s.length * 2 + 1;
    const next = [];
    for (const x of s) { next.push(x); next.push(m - x); }
    s = next;
  }
  return s;
}
const playoff = (() => {
  const T = (t) => ({ n: t[0], f: t[1], s: t[2] });
  // 12 group winners + 12 runners-up + 8 best third places = 32 teams
  const winners = favourites.map((x) => T(x.first));
  const runners = favourites.map((x) => T(x.second));
  const thirds = GROUP_LETTERS
    .map((g) => T([...GROUPS[g]].sort((x, y) => y[2] - x[2])[2]))
    .sort((a, b) => b.s - a.s)
    .slice(0, 8);
  const pool = [...winners, ...runners, ...thirds].sort((a, b) => b.s - a.s);
  const seeds = buildSeedOrder(32).map((s) => pool[s - 1]);
  const r32pairs = [];
  for (let i = 0; i < 32; i += 2) r32pairs.push([seeds[i], seeds[i + 1]]);

  // ---- real results (1/16 + 1/8 + 1/4 played; 1/2, финал, бронза — впереди) ----
  const rr = rng(424242);
  const realPlay = (a, b) => {
    const aWin = a.s + (rr() - 0.5) * 0.16 >= b.s + (rr() - 0.5) * 0.16;
    const pens = rr() < 0.16;
    let sa, sb;
    if (pens) { const g = Math.round(rr() * 2); sa = g; sb = g; }
    else { const hi = 1 + Math.round(rr() * 2), lo = Math.round(rr() * Math.max(0, hi - 1)); sa = aWin ? hi : lo; sb = aWin ? lo : hi; }
    return { a, b, scoreA: sa, scoreB: sb, winner: aWin ? a : b, loser: aWin ? b : a, pens, played: true };
  };
  const adv = (round) => { const n = []; for (let i = 0; i < round.length; i += 2) n.push(realPlay(round[i].winner, round[i + 1].winner)); return n; };
  const realR32 = r32pairs.map(([a, b]) => realPlay(a, b));
  const realR16 = adv(realR32);
  const realQF = adv(realR16);
  const semis = realQF.map((m) => m.winner);
  const realSF = [[semis[0], semis[1]], [semis[2], semis[3]]].map(([a, b]) => ({ a, b, scoreA: null, scoreB: null, winner: null, played: false }));
  const furthest = {}; seeds.forEach((t) => (furthest[t.n] = 1));
  realR32.forEach((m) => (furthest[m.winner.n] = 2));
  realR16.forEach((m) => (furthest[m.winner.n] = 3));
  realQF.forEach((m) => (furthest[m.winner.n] = 4));
  const aliveSet = new Set(semis.map((t) => t.n));

  const slimMatch = (m) => ({ a: slimT(m.a), b: slimT(m.b), scoreA: m.scoreA ?? null, scoreB: m.scoreB ?? null, winner: m.winner ? slimT(m.winner) : null, pens: !!m.pens, played: !!m.played });
  const blankF = { a: null, b: null, scoreA: null, scoreB: null, winner: null, played: false };
  const real = {
    playedThrough: 3,
    rounds: [
      { key: "r32", title: "1/16 финала", matches: realR32.map(slimMatch) },
      { key: "r16", title: "1/8 финала", matches: realR16.map(slimMatch) },
      { key: "qf", title: "1/4 финала", matches: realQF.map(slimMatch) },
      { key: "sf", title: "1/2 финала", matches: realSF.map(slimMatch) },
      { key: "f", title: "Финал", matches: [{ ...blankF }] },
    ],
    third: { ...blankF },
    champion: null,
    aliveTeams: semis.map(slimT),
  };

  // ---- per-participant blind brackets ----
  const sameTeams = (m, rm) => rm && ((m.a.n === rm.a.n && m.b.n === rm.b.n) || (m.a.n === rm.b.n && m.b.n === rm.a.n));
  const stateVs = (m, rm) => {
    if (!sameTeams(m, rm)) return "dead";
    if (m.winner.n !== rm.winner.n) return "miss";
    return m.scoreA === rm.scoreA && m.scoreB === rm.scoreB ? "exact" : "hit";
  };

  const brackets = NAMES.map((name, idx) => {
    const pr = rng(900000 + idx * 97);
    const noise = 1.2 - participants[idx].skill / 100; // weaker predictor → more upsets
    const pplay = (a, b) => {
      const aWin = a.s + (pr() - 0.5) * noise >= b.s + (pr() - 0.5) * noise;
      const hi = 1 + Math.round(pr() * 2), lo = Math.round(pr() * Math.max(0, hi - 1));
      return { a, b, scoreA: aWin ? hi : lo, scoreB: aWin ? lo : hi, winner: aWin ? a : b, loser: aWin ? b : a };
    };
    const padv = (round) => { const n = []; for (let i = 0; i < round.length; i += 2) n.push(pplay(round[i].winner, round[i + 1].winner)); return n; };
    const R32 = r32pairs.map(([a, b]) => pplay(a, b));
    const R16 = padv(R32);
    const QF = padv(R16);
    const SF = padv(QF);
    const F = pplay(SF[0].winner, SF[1].winner);
    const TH = pplay(SF[0].loser, SF[1].loser);

    const stR32 = R32.map((m, i) => stateVs(m, realR32[i]));
    const stR16 = R16.map((m, i) => stateVs(m, realR16[i]));
    const stQF = QF.map((m, i) => stateVs(m, realQF[i]));
    const aliveBoth = (m) => (aliveSet.has(m.a.n) && aliveSet.has(m.b.n) ? "alive" : "dead");
    const stSF = SF.map(aliveBoth);
    const stF = aliveBoth(F);

    const finalFour = [SF[0].a, SF[0].b, SF[1].a, SF[1].b];
    const aliveCount = finalFour.filter((t) => aliveSet.has(t.n)).length;
    const championAlive = aliveSet.has(F.winner.n);
    const finalistAlive = aliveSet.has(F.loser.n);
    const exactPlayoff = [...stR32, ...stR16, ...stQF].filter((s) => s === "exact").length;
    const potential = (championAlive ? 55 : 0) + (finalistAlive ? 15 : 0) + aliveCount * 22;

    const mm = (m, state) => ({ a: slimT(m.a), b: slimT(m.b), scoreA: m.scoreA, scoreB: m.scoreB, winner: slimT(m.winner), state });
    return {
      id: idx, name,
      champion: slimT(F.winner), finalist: slimT(F.loser), third: slimT(TH.winner),
      championStatus: championAlive ? "жив" : "выбыл",
      aliveCount, potential, exactPlayoff,
      burnedChampion: championAlive ? null : { team: F.winner.n, flag: F.winner.f, stage: STAGE_LABEL[furthest[F.winner.n]] },
      rounds: [
        { key: "r32", title: "1/16 финала", matches: R32.map((m, i) => mm(m, stR32[i])) },
        { key: "r16", title: "1/8 финала", matches: R16.map((m, i) => mm(m, stR16[i])) },
        { key: "qf", title: "1/4 финала", matches: QF.map((m, i) => mm(m, stQF[i])) },
        { key: "sf", title: "1/2 финала", matches: SF.map((m, i) => mm(m, stSF[i])) },
        { key: "f", title: "Финал", matches: [mm(F, stF)] },
      ],
      thirdMatch: mm(TH, aliveBoth(TH)),
      _r32w: R32.map((m) => m.winner.n),
      _r16w: R16.map((m) => m.winner.n),
      _qfw: QF.map((m) => m.winner.n),
      _sfw: SF.map((m) => m.winner.n),
      _fw: F.winner.n,
      _scores32: R32.map((m) => `${m.scoreA}:${m.scoreB}`),
    };
  });

  // keep each participant's pre-tournament champion consistent with their bracket
  brackets.forEach((b, i) => { participants[i].champion = b.champion.n; });

  // ---- majority bracket (mode per bracket position) ----
  const mode = (arr) => {
    const c = {}; arr.forEach((x) => (c[x] = (c[x] || 0) + 1));
    const [name, votes] = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
    return { name, votes };
  };
  const teamByName = (n) => slimT(seeds.find((x) => x.n === n));
  const majRound = (title, key, count, picker, pairs) =>
    ({ key, title, matches: Array.from({ length: count }, (_, i) => {
      const w = mode(brackets.map((b) => picker(b)[i]));
      const sc = key === "r32" ? mode(brackets.map((b) => b._scores32[i])).name : null;
      return { a: pairs ? pairs[i][0] : null, b: pairs ? pairs[i][1] : null, winner: teamByName(w.name), votes: w.votes, total: NAMES.length, score: sc };
    }) });
  const pairUp = (arr) => { const p = []; for (let i = 0; i < arr.length; i += 2) p.push([arr[i], arr[i + 1]]); return p; };
  const majR32 = majRound("1/16 финала", "r32", 16, (b) => b._r32w, r32pairs.map(([a, b]) => [slimT(a), slimT(b)]));
  const majR16 = majRound("1/8 финала", "r16", 8, (b) => b._r16w, pairUp(majR32.matches.map((m) => m.winner)));
  const majQF = majRound("1/4 финала", "qf", 4, (b) => b._qfw, pairUp(majR16.matches.map((m) => m.winner)));
  const majSF = majRound("1/2 финала", "sf", 2, (b) => b._sfw, pairUp(majQF.matches.map((m) => m.winner)));
  const majFinal = majRound("Финал", "f", 1, (b) => [b._fw], [[majSF.matches[0].winner, majSF.matches[1].winner]]);
  const majR16w = majR16.matches.map((m) => m.winner);
  const majority = {
    rounds: [majR32, majR16, majQF, majSF, majFinal],
    champion: majFinal.matches[0].winner,
  };

  // strip helper raw fields from output brackets
  const outBrackets = brackets.map((b) => ({
    id: b.id, name: b.name, champion: b.champion, finalist: b.finalist, third: b.third,
    championStatus: b.championStatus, aliveCount: b.aliveCount, potential: b.potential,
    exactPlayoff: b.exactPlayoff, burnedChampion: b.burnedChampion,
    rounds: b.rounds, thirdMatch: b.thirdMatch,
  }));

  // ---- derived emotional blocks ----
  const championGroups = {};
  brackets.forEach((b) => {
    const k = b.champion.n;
    (championGroups[k] ??= { team: b.champion.n, flag: b.champion.f, count: 0, alive: aliveSet.has(k), participants: [] });
    championGroups[k].count++;
    championGroups[k].participants.push(b.name);
  });
  const championAlive = Object.values(championGroups)
    .map((g) => ({ ...g, status: g.alive ? "жив" : "выбыл" }))
    .sort((a, b) => b.count - a.count || (b.alive ? 1 : 0) - (a.alive ? 1 : 0));

  const burned = brackets
    .filter((b) => b.burnedChampion)
    .map((b) => ({
      name: b.name, team: b.burnedChampion.team, flag: b.burnedChampion.flag,
      stage: b.burnedChampion.stage, pointsLost: 63,
    }))
    .sort((a, b) => b.pointsLost - a.pointsLost || a.name.localeCompare(b.name));

  const liveBrackets = [...outBrackets]
    .sort((a, b) => b.aliveCount - a.aliveCount || b.potential - a.potential)
    .slice(0, 6)
    .map((b) => ({ name: b.name, aliveCount: b.aliveCount, potential: b.potential, champion: b.champion, championStatus: b.championStatus }));

  const nextStakes = realSF.map((m) => {
    const a = m.a, b = m.b;
    const votesA = brackets.filter((x) => x.finalist.n === a.n || x.champion.n === a.n).length;
    const votesB = brackets.filter((x) => x.finalist.n === b.n || x.champion.n === b.n).length;
    const critical = brackets.filter((x) => [x.champion.n, x.finalist.n].includes(a.n) || [x.champion.n, x.finalist.n].includes(b.n)).length;
    return { a: slimT(a), b: slimT(b), votesA, votesB, critical, swing: critical * 18 + 55 };
  });

  // reality vs majority: how many of the real quarter-finalists the majority predicted to reach 1/4
  const realQFTeams = new Set(realR16.map((m) => m.winner.n)); // 8 teams that reached 1/4
  const majQFTeams = new Set(majR16w.map((t) => t.n));
  const qfHit = [...realQFTeams].filter((n) => majQFTeams.has(n)).length;
  // biggest miss = team the majority expected in the 1/4 that didn't get there
  const missName = [...majQFTeams].find((n) => !realQFTeams.has(n));
  const missTeam = missName ? teamByName(missName) : null;
  const realityVsMajority = { qfHit, qfTotal: 8, biggestMiss: missTeam ? { team: missTeam.n, flag: missTeam.f } : null };

  return {
    real, majority, brackets: outBrackets,
    championAlive, burned, liveBrackets, nextStakes, realityVsMajority,
    aliveTeams: semis.map(slimT),
  };
})();

// rank now (desc by total, tie-break exact scores)
const ranked = [...participants].sort(
  (a, b) => b.points.total - a.points.total || b.stats.exactScores - a.stats.exactScores
);
ranked.forEach((p, i) => { p.rank = i + 1; });

// rank after round 1 → movement (positions gained/lost)
const afterR1 = [...participants].sort((a, b) => b.history[1].total - a.history[1].total);
const rankR1 = new Map(afterR1.map((p, i) => [p.id, i + 1]));
const movement = participants
  .map((p) => ({ id: p.id, name: p.name, places: rankR1.get(p.id) - p.rank, rank: p.rank }))
  .sort((a, b) => b.places - a.places);

// round delta (points earned in round 2)
const roundDelta = participants
  .map((p) => ({ id: p.id, name: p.name, delta: p.history[2].total - p.history[1].total }))
  .sort((a, b) => b.delta - a.delta);

// ---------- league prediction distribution for EVERY match (15 participants) ----------
// Used by the "today" block and by the "majority forecast" pills inside group cards.
const predictions = {};
matches.forEach((m, gi) => {
  const dist = { home: 0, draw: 0, away: 0 };
  const scoreCount = {};
  for (let idx = 0; idx < NAMES.length; idx++) {
    const p = pickFor(idx, m, 1000 + gi);
    dist[p.outcome]++;
    const key = `${p.ph}:${p.pa}`;
    scoreCount[key] = (scoreCount[key] || 0) + 1;
  }
  predictions[m.id] = { ...dist, score: Object.entries(scoreCount).sort((a, b) => b[1] - a[1])[0][0] };
});

// ---------- "today" matches ----------
const today = {
  date: DEMO_TODAY,
  matches: todayMatches.map((m) => {
    const d = predictions[m.id];
    const fav = d.home >= d.away && d.home >= d.draw ? m.home : d.away >= d.draw ? m.away : null;
    const impact = fav
      ? `Если ${fav} выиграет — заметно приблизится к выходу из группы.`
      : "Большинство ждёт ничью — группа останется открытой.";
    return {
      id: m.id, group: m.group, time: m.time, city: m.city,
      home: m.home, away: m.away, homeFlag: m.homeFlag, awayFlag: m.awayFlag,
      dist: { home: d.home, draw: d.draw, away: d.away }, popularScore: d.score,
      potential: 15 * 5, impact,
    };
  }),
};
today.potentialTotal = today.matches.reduce((s, m) => s + m.potential, 0);

// who is most "against the crowd" today (picks differ from the per-match majority)
const majorityByMatch = today.matches.map((m) =>
  m.dist.home >= m.dist.away && m.dist.home >= m.dist.draw ? "home" : m.dist.away >= m.dist.draw ? "away" : "draw"
);
const contrarianScore = todayPickMatrix.map((row, idx) => ({
  id: idx, name: NAMES[idx],
  n: row.reduce((s, p, mi) => s + (p.outcome !== majorityByMatch[mi] ? 1 : 0), 0),
})).sort((a, b) => b.n - a.n);

// threat to the leader: nearest challenger who could overtake with today's max haul
const leader = ranked[0];
const maxToday = today.matches.length * 5;
const challenger = ranked.slice(1).find((p) => p.points.total + maxToday >= leader.points.total) ?? ranked[1];
const cm = todayMatches[0];
const cp = challenger ? pickFor(challenger.id, cm, 0) : null;
const threatCondition = cp
  ? `если ${cp.outcome === "draw" ? `${cm.home} и ${cm.away} сыграют вничью` : `${cp.outcome === "home" ? cm.home : cm.away} победит ${Math.max(cp.ph, cp.pa)}:${Math.min(cp.ph, cp.pa)}`}`
  : "";

// champion distribution across the league
const champCount = {};
participants.forEach((p) => { champCount[p.champion] = (champCount[p.champion] || 0) + 1; });
const leagueChampions = Object.entries(champCount)
  .map(([team, count]) => ({ team, count, flag: FLAG_OF.get(team) ?? "" }))
  .sort((a, b) => b.count - a.count);

const oracle = [...participants].sort((a, b) => b.stats.exactScores - a.stats.exactScores)[0];
const almostOracle = [...participants].sort((a, b) => b.stats.nearMiss - a.stats.nearMiss)[0];

// most popular predicted scoreline across today's matches
const allScoreCount = {};
today.matches.forEach((m) => { allScoreCount[m.popularScore] = (allScoreCount[m.popularScore] || 0) + 1; });
const majorityScore = Object.entries(allScoreCount).sort((a, b) => b[1] - a[1])[0][0];

const demo = {
  mode: "demo",
  demoToday: DEMO_TODAY,
  participants,
  awards: {
    leader: ranked[0],
    oracle,
    roundLeader: roundDelta[0],
    var: roundDelta[roundDelta.length - 1], // "Попал под VAR" — least points this round
  },
  today,
  predictions,
  facts: {
    // computed from the demo simulation
    comeback: { name: movement[0].name, places: movement[0].places, round: 2 },
    underPressure: { name: movement[movement.length - 1].name, places: -movement[movement.length - 1].places },
    againstCrowd: { name: contrarianScore[0].name, count: contrarianScore[0].n },
    almostOracle: { name: almostOracle.name, times: almostOracle.stats.nearMiss },
    leagueChampions,
    threat: { name: challenger?.name ?? ranked[1].name, condition: threatCondition },
    openPoints: { points: today.potentialTotal },
    majorityScore: { score: majorityScore },
    // illustrative mock — needs real group-stage pick data to compute (data contract below)
    tableTurner: { match: "Норвегия — Франция", positions: 7 },
    rarePick: { team: "Гаити", count: 2, total: 15 },
  },
};

writeFileSync(join(OUT, "tournament.json"), JSON.stringify(tournament, null, 1));
writeFileSync(join(OUT, "demo.json"), JSON.stringify(demo, null, 1));
writeFileSync(join(OUT, "playoff.json"), JSON.stringify(playoff, null, 0));
console.log(`✓ playoff.json — alive ${playoff.aliveTeams.map((t) => t.n).join(", ")}; QF hit by majority ${playoff.realityVsMajority.qfHit}/8; burned ${playoff.burned.length}`);

const played = matches.filter((m) => m.goalsHome != null).length;
console.log(`✓ tournament.json — ${teams.length} teams, ${matches.length} fixtures (${played} played), ${HOST_CITIES.length} host cities`);
console.log(`✓ demo.json — leader ${ranked[0].name} (${ranked[0].points.total}), today ${today.matches.length} matches, ${today.potentialTotal} pts in play`);
