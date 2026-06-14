// Playoff data shapes (types only — the live data is built in realData.ts).
export type PoTeam = { n: string; f: string } | null;
export type PoState = "exact" | "hit" | "miss" | "dead" | "alive";

export type PoMatch = {
  a: PoTeam;
  b: PoTeam;
  scoreA?: number | null;
  scoreB?: number | null;
  winner?: PoTeam;
  pens?: boolean;
  played?: boolean;
  state?: PoState;
  votes?: number;
  total?: number;
  score?: string | null;
};

export type PoRound = { key: string; title: string; matches: PoMatch[] };

export type PlayoffParticipant = {
  id: number;
  name: string;
  champion: PoTeam;
  finalist: PoTeam;
  third: PoTeam;
  championStatus: string;
  aliveCount: number;
  potential: number;
  exactPlayoff: number;
  burnedChampion: { team: string; flag: string; stage: string } | null;
  rounds: PoRound[];
  thirdMatch: PoMatch;
};

export type ChampionAliveItem = {
  team: string; flag: string; count: number; alive: boolean; status: string; participants: string[];
};
