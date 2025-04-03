// server/socket/types.ts
export interface GameText {
  id: string;
  text: string;
  difficulty: string;
}

export interface Room {
  id: string;
  players: Player[];
  isPrivate: boolean;
  gameText?: string;
  countdown?: number;
  isGameInProgress: boolean;
  results: GameResult[];
}

export interface Player {
  id: string;
  username: string;
  socketId: string;
  isReady: boolean;
  progress: number;
  wpm: number;
  accuracy: number;
  finished: boolean;
  position?: number;
}

export interface GameResult extends Player {
  position: number;
}