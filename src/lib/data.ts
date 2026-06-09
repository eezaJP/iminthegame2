import tournamentJson from "@/data/tournament.json";
import demoJson from "@/data/demo.json";
import type { Demo, Match, Tournament } from "./types";

export const tournament = tournamentJson as unknown as Tournament;
export const demo = demoJson as unknown as Demo;

/** Demo mode: data is simulated. Flip to false once Google Sheets/API is wired in. */
export const isDemoMode = demo.mode === "demo";

/** Points earned in the most recently completed round (history: Старт, Тур1, Тур2, Сейчас). */
export function roundGainOf(p: { history: { total: number }[] }) {
  return p.history[2].total - p.history[1].total;
}

const FLAG_BY_NAME = new Map(tournament.teams.map((t) => [t.name, t.flag]));
export function flagOf(name: string): string | undefined {
  return FLAG_BY_NAME.get(name);
}

export function standings() {
  return [...demo.participants].sort((a, b) => a.rank - b.rank);
}

export function matchesByGroup(group: string): Match[] {
  return tournament.matches.filter((m) => m.group === group);
}

export type GroupRow = {
  name: string;
  flag: string;
  played: number;
  win: number;
  draw: number;
  loss: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
};

/** Live mini-table for a group, computed from played matches (win 3 / draw 1). */
export function groupTable(letter: string): GroupRow[] {
  const g = tournament.groups.find((x) => x.letter === letter);
  if (!g) return [];
  const rows = new Map<string, GroupRow>(
    g.teams.map((t) => [
      t.name,
      { name: t.name, flag: t.flag, played: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0, gd: 0, points: 0 },
    ])
  );
  for (const m of matchesByGroup(letter)) {
    if (m.goalsHome === null || m.goalsAway === null) continue;
    const h = rows.get(m.home)!;
    const a = rows.get(m.away)!;
    h.played++; a.played++;
    h.gf += m.goalsHome; h.ga += m.goalsAway;
    a.gf += m.goalsAway; a.ga += m.goalsHome;
    if (m.goalsHome > m.goalsAway) { h.win++; h.points += 3; a.loss++; }
    else if (m.goalsHome < m.goalsAway) { a.win++; a.points += 3; h.loss++; }
    else { h.draw++; a.draw++; h.points++; a.points++; }
  }
  return [...rows.values()]
    .map((r) => ({ ...r, gd: r.gf - r.ga }))
    .sort((x, y) => y.points - x.points || y.gd - x.gd || y.gf - x.gf || x.name.localeCompare(y.name));
}

export function playedCount() {
  return tournament.matches.filter((m) => m.goalsHome !== null).length;
}

/** Distinct fixture dates that have at least one match, ascending. */
export function fixtureDates() {
  return [...new Set(tournament.matches.map((m) => m.date))].sort();
}

/**
 * Given an ISO "today", return the set of matches to spotlight on the map:
 * matches happening today, else the next upcoming match day.
 */
export function spotlightMatches(todayIso: string) {
  const today = tournament.matches.filter((m) => m.date === todayIso);
  if (today.length) return { date: todayIso, isToday: true, matches: today };
  const upcoming = fixtureDates().find((d) => d >= todayIso);
  if (!upcoming) {
    const last = fixtureDates().at(-1)!;
    return { date: last, isToday: false, matches: tournament.matches.filter((m) => m.date === last) };
  }
  return {
    date: upcoming,
    isToday: false,
    matches: tournament.matches.filter((m) => m.date === upcoming),
  };
}

export function matchesForCity(cityId: number, dateIso: string) {
  return tournament.matches.filter((m) => m.cityId === cityId && m.date === dateIso);
}

// ============================ group-stage helpers ============================
export const demoToday = demo.demoToday;

export function predictionFor(matchId: string) {
  return demo.predictions[matchId];
}

export function todayMatchesList() {
  return tournament.matches.filter((m) => m.date === demoToday);
}

/** Status label for a group based on how many matches are played. */
export function groupStatus(letter: string): {
  label: string;
  tone: "done" | "live" | "progress" | "soon";
} {
  const ms = matchesByGroup(letter);
  const played = ms.filter((m) => m.goalsHome !== null).length;
  const hasToday = ms.some((m) => m.date === demoToday);
  if (played === ms.length) return { label: "Группа завершена", tone: "done" };
  if (played === 0) return { label: "Скоро старт", tone: "soon" };
  if (hasToday) return { label: "Последний тур · сегодня", tone: "live" };
  const rounds = Math.min(3, Math.ceil(played / 2));
  return { label: `${rounds}/3 тура сыграно`, tone: "progress" };
}

/** Heuristic intrigue read of a group from its live table. */
export function groupInsight(letter: string) {
  const [a, b, c, d] = groupTable(letter);
  const gap23 = b.points - c.points;
  const gap24 = b.points - d.points;
  const keyMatch = matchesByGroup(letter).find((m) => m.goalsHome === null);
  const contenders = [b, c, d.points >= b.points - 2 ? d : null]
    .filter(Boolean)
    .map((x) => x!.name);
  return {
    letter,
    open: gap23 <= 2,
    decided: gap23 >= 4,
    gap23,
    leader: a.name,
    second: b.name,
    third: c.name,
    last: d.name,
    contenders,
    keyMatch: keyMatch ? `${keyMatch.home} — ${keyMatch.away}` : null,
    openScore: (gap23 <= 1 ? 3 : gap23 <= 2 ? 2 : 0) + (gap24 <= 2 ? 1 : 0),
  };
}

export type GroupInsight = ReturnType<typeof groupInsight>;

export function groupInsights(): GroupInsight[] {
  return tournament.groups.map((g) => groupInsight(g.letter));
}

export function intrigueGroups(limit = 4) {
  return groupInsights()
    .filter((g) => g.open)
    .sort((x, y) => y.openScore - x.openScore)
    .slice(0, limit);
}

export function almostDecidedGroups(limit = 3) {
  return groupInsights()
    .filter((g) => g.decided)
    .sort((x, y) => y.gap23 - x.gap23)
    .slice(0, limit);
}

/** Short human-readable summary for a group-card footer. */
export function groupSummary(letter: string) {
  const g = groupInsight(letter);
  if (g.open && g.keyMatch) return `Всё решается в последнем туре: ${g.keyMatch}.`;
  if (g.decided) return `${g.leader} и ${g.second} впереди, ${g.last} почти выбыл.`;
  return `${g.leader} лидирует, борьба за второе место продолжается.`;
}

/** Race for the 8 best third places across all 12 groups. */
export function thirdPlaceRace() {
  const rows = tournament.groups.map((g) => ({ ...groupTable(g.letter)[2], group: g.letter }));
  rows.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name));
  return rows.map((r, i) => ({
    ...r,
    raceRank: i + 1,
    status: (i < 8 ? "in" : i < 10 ? "edge" : "out") as "in" | "edge" | "out",
  }));
}
