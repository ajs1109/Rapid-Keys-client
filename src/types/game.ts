export type GameState = 'auth' | 'mode-select' | 'single' | 'multi';
export type GameMode = 'single' | 'multi' | null;
export type GameDifficulty = 'easy' | 'normal' | 'hard';

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface GameSettings {
  difficulty: GameDifficulty;
  timeLimit: number;
}

export interface GameStore {
  gameState: GameState;
  user: User | null;
  gameMode: GameMode;
  gameSettings: GameSettings;  
  
  setGameState: (state: GameState) => void;
  setUser: (user: User | null) => void;
  setGameMode: (mode: GameMode) => void;
  updateGameSettings: (settings: Partial<GameSettings>) => void;
  reset: () => void;
}