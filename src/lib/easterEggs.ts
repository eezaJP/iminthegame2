// Hidden easter-eggs, keyed by the exact MATCH (the pair of teams). A clip belongs
// to ONE game: it plays only in that tie — its match rows, the countdown, and its
// slot in the bracket sketch — and NEVER follows a team into another/future match.
// The media can be a video (played with sound) or an image (EasterEgg detects the
// type by extension). Files live in /public. Single source of truth for
// TodayMatches + NextMatchCountdown + PlayoffBracket.
//
// `both`   — the same clip for either team of the tie.
// `perTeam`— the two sides of one tie get different clips (e.g. in Бразилия–Норвегия
//            tapping Бразилия plays one video, Норвегия another).
// (The eliminated-champion "Бразилия" card in PlayoffBlocks is a separate trigger.)
type EggMedia = { both?: string; perTeam?: Record<string, string> };

const EGG_MATCHES: { teams: [string, string]; media: EggMedia }[] = [
  { teams: ["Бразилия", "Норвегия"], media: { perTeam: { "Бразилия": "/brazil-out.mp4", "Норвегия": "/norway.mp4" } } },
  { teams: ["США", "Бельгия"], media: { perTeam: { "США": "/usa-belgium.mp4" } } },
  { teams: ["Мексика", "Англия"], media: { both: "/mexico-england.jpg" } },
  { teams: ["Португалия", "Испания"], media: { both: "/por-esp.mp4" } },
  { teams: ["Норвегия", "Англия"], media: { both: "/norway-england.mp4" } },
  { teams: ["Франция", "Испания"], media: { both: "/fra-esp-semi.mp4" } },
  { teams: ["Англия", "Аргентина"], media: { both: "/eng-arg.mp4" } },
  { teams: ["Франция", "Англия"], media: { both: "/fra-eng.mp4" } },
];

/** Media for `team` when it plays `opponent` — bound to that exact tie, so a clip
 *  never leaks into a team's other matches. Returns undefined if this tie has no egg. */
export function eggMediaFor(team: string, opponent?: string): string | undefined {
  if (!opponent) return undefined;
  const m = EGG_MATCHES.find(
    (e) => (e.teams[0] === team && e.teams[1] === opponent) || (e.teams[0] === opponent && e.teams[1] === team),
  );
  if (!m) return undefined;
  return m.media.perTeam?.[team] ?? m.media.both;
}
