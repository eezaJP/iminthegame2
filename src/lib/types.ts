export type TeamRef = { name: string; flag: string };

export type Match = {
  id: string;
  group: string;
  matchday: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (МСК)
  cityId: number;
  city: string;
  country: "USA" | "CAN" | "MEX";
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
  goalsHome: number | null;
  goalsAway: number | null;
};

export type HostCity = {
  id: number;
  city: string;
  country: "USA" | "CAN" | "MEX";
  x: number;
  y: number;
};

export type PlayoffStage = {
  key: string;
  title: string;
  matches: number;
  win: number;
  exact: number;
  bonus: number;
};

export type Favourite = {
  group: string;
  first: [string, string, number];
  second: [string, string, number];
};

export type BracketTeam = { name: string; flag: string; s: number; group: string };
export type BracketMatch = {
  a: BracketTeam;
  b: BracketTeam;
  scoreA: number;
  scoreB: number;
  winner: BracketTeam;
  loser: BracketTeam;
};
export type BracketPreview = {
  rounds: { key: string; title: string; matches: BracketMatch[] }[];
  third: BracketMatch;
  champion: BracketTeam;
};

export type Tournament = {
  meta: {
    name: string;
    hosts: string[];
    start: string;
    tz: string;
    participants: number;
    playedThroughMatchday: number;
  };
  groups: { letter: string; teams: TeamRef[] }[];
  teams: { id: number; name: string; flag: string; group: string; strength: number }[];
  matches: Match[];
  hostCities: HostCity[];
  playoffStages: PlayoffStage[];
  favourites: Favourite[];
  bracketPreview: BracketPreview;
};

export type Participant = {
  id: number;
  name: string;
  avatarSeed: number;
  champion: string;
  skill: number;
  rank: number;
  points: {
    groupMatches: number;
    groupStandings: number;
    playoffMatches: number;
    squadBonus: number;
    finalBets: number;
    total: number;
  };
  history: { label: string; total: number }[];
  stats: { exactScores: number; correctOutcomes: number; predictions: number; nearMiss: number; contrarian: number };
};

export type TodayMatch = {
  id: string;
  group: string;
  time: string;
  city: string;
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
  dist: { home: number; draw: number; away: number };
  popularScore: string;
  potential: number;
  impact?: string;
  status: "upcoming" | "live" | "finished";
  gh: number | null;
  ga: number | null;
  kickoff: number; // epoch ms (real kickoff)
};

export type NextMatch = {
  kickoff: number; // epoch ms
  time: string;    // HH:MM МСК
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
};

export type PredictionDist = { home: number; draw: number; away: number; score: string };

export type Demo = {
  mode: string;
  demoToday: string;
  participants: Participant[];
  awards: {
    leader: Participant;
    oracle: Participant;
    roundLeader: { id: number; name: string; delta: number };
    var: { id: number; name: string; delta: number };
  };
  today: { date: string; potentialTotal: number; matches: TodayMatch[] };
  predictions: Record<string, PredictionDist>;
  facts: {
    comeback: { name: string; places: number; round: number };
    underPressure: { name: string; places: number };
    againstCrowd: { name: string; count: number };
    almostOracle: { name: string; times: number };
    leagueChampions: { team: string; count: number; flag: string }[];
    threat: { name: string; condition: string };
    openPoints: { points: number };
    majorityScore: { score: string };
    tableTurner: { match: string; positions: number };
    rarePick: { team: string; count: number; total: number };
  };
};
