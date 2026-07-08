// Hidden easter-eggs: tapping one of these teams opens a short clip in a modal.
// The media can be a video (played with sound) OR an image (EasterEgg detects the
// type by extension). Files live in /public. Single source of truth for
// TodayMatches + PlayoffBracket + NextMatchCountdown.

// Base teams — the egg fires EVERYWHERE: the "Матчи 1/8" / "Матчи плей-офф сегодня"
// match rows, the countdown, AND the bracket sketch rows.
export const EGG_TEAM_VIDEOS: Record<string, string> = {
  "США": "/usa-belgium.mp4",
  "Бразилия": "/brazil-out.mp4",
  "Норвегия": "/norway.mp4",
  "Мексика": "/mexico-england.jpg",
  "Англия": "/mexico-england.jpg",
};

// Match-only teams — the egg fires ONLY in the match rows, NOT in the bracket
// sketch (per user request: Португалия/Испания play in the same 1/8 tie).
export const EGG_MATCH_ONLY_VIDEOS: Record<string, string> = {
  "Португалия": "/portugal-spain.mp4",
  "Испания": "/portugal-spain.mp4",
};

// Combined map used by the match rows (TodayMatches). The bracket uses the base
// map only, so Португалия/Испания stay non-clickable in the sketch.
export const EGG_MATCH_VIDEOS: Record<string, string> = { ...EGG_TEAM_VIDEOS, ...EGG_MATCH_ONLY_VIDEOS };

// Match-SPECIFIC eggs — keyed by the PAIR of teams, so a tie can have its own clip
// that overrides each team's per-team media. Needed when both teams already have
// their own egg from other matches (e.g. Норвегия has norway.mp4 vs Бразилия and
// Англия has the meme vs Мексика, but their 1/4 tie gets its own video).
const EGG_MATCH_PAIRS: { teams: [string, string]; video: string }[] = [
  { teams: ["Норвегия", "Англия"], video: "/norway-england.mp4" },
];

/** Media for a team tapped inside a specific match. A pair-specific egg wins over
 *  the per-team media, so the same team can show different clips in different ties. */
export function eggMediaFor(team: string, opponent?: string): string | undefined {
  if (opponent) {
    const pair = EGG_MATCH_PAIRS.find(
      (p) => (p.teams[0] === team && p.teams[1] === opponent) || (p.teams[0] === opponent && p.teams[1] === team),
    );
    if (pair) return pair.video;
  }
  return EGG_MATCH_VIDEOS[team];
}
