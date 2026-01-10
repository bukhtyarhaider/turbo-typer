export enum GameStatus {
  IDLE = "IDLE",
  PLAYING = "PLAYING",
  FINISHED = "FINISHED",
  LOADING = "LOADING",
}

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

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
