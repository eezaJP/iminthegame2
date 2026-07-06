// Hidden easter-eggs: tapping one of these teams (a bracket row, or its side of a
// knockout match in the "Матчи 1/8" block) opens a short video WITH SOUND.
// Videos live in /public. Single source of truth for TodayMatches + PlayoffBracket.
export const EGG_TEAM_VIDEOS: Record<string, string> = {
  "США": "/usa-belgium.mp4",
  "Бразилия": "/brazil-out.mp4",
  "Норвегия": "/norway.mp4",
};
