// Hidden easter-eggs: tapping one of these teams opens a short video WITH SOUND.
// Videos live in /public. Single source of truth for TodayMatches + PlayoffBracket.

// Base teams — the egg fires EVERYWHERE: the "Матчи 1/8" / "Матчи плей-офф сегодня"
// match rows AND the bracket sketch rows.
export const EGG_TEAM_VIDEOS: Record<string, string> = {
  "США": "/usa-belgium.mp4",
  "Бразилия": "/brazil-out.mp4",
  "Норвегия": "/norway.mp4",
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
