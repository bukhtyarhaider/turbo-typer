export enum GameStatus {
  IDLE = "IDLE",
  PLAYING = "PLAYING",
  FINISHED = "FINISHED",
  LOADING = "LOADING",
  BATTLE_LOBBY = "BATTLE_LOBBY",
  BATTLE_PLAYING = "BATTLE_PLAYING",
}

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface PlayerInfo {
  id: string;
  name: string;
  wpm: number;
  progress: number;
  speed: number;
  hasShield: boolean;
  score: number;
  isFinished?: boolean;
}

export interface BattleState {
  players: Record<string, PlayerInfo>;
  targetText: string;
  startTime?: number;
}

export interface Obstacle {
  id: number;
  x: number;
  type: "rock" | "cone" | "puddle";
  hit: boolean;
}

export interface PowerUp {
  id: number;
  x: number;
  type: "nitro" | "shield";
  collected: boolean;
}

export interface GameStats {
  wpm: number;
  accuracy: number;
  errors: number;
  progress: number;
  remainingChars: number;
}

export interface GameReport {
  finalWpm: number;
  netWpm: number;
  accuracy: number;
  timeSeconds: number;
  errors: number;
  isNewRecord: boolean;
  highScore: number;
  rank: string;
  history: number[];
}

export interface BattleResult {
  winner: PlayerInfo;
  loser: PlayerInfo;
  myReport: GameReport;
  iWon: boolean;
  timeDiff?: number; // seconds difference
}
