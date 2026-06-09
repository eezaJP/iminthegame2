import playoffJson from "@/data/playoff.json";

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

export type PlayoffData = {
  real: { playedThrough: number; rounds: PoRound[]; third: PoMatch; champion: PoTeam; aliveTeams: { n: string; f: string }[] };
  majority: { rounds: PoRound[]; champion: PoTeam };
  brackets: PlayoffParticipant[];
  championAlive: { team: string; flag: string; count: number; alive: boolean; status: string; participants: string[] }[];
  burned: { name: string; team: string; flag: string; stage: string; pointsLost: number }[];
  liveBrackets: { name: string; aliveCount: number; potential: number; champion: PoTeam; championStatus: string }[];
  nextStakes: { a: PoTeam; b: PoTeam; votesA: number; votesB: number; critical: number; swing: number }[];
  realityVsMajority: { qfHit: number; qfTotal: number; biggestMiss: { team: string; flag: string } | null };
  aliveTeams: { n: string; f: string }[];
};

export const playoff = playoffJson as unknown as PlayoffData;

/** Champion not yet decided in this demo (semifinals upcoming). */
export const championDecided = playoff.real.champion !== null;
