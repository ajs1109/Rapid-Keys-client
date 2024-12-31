
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameStore, GameSettings, User, GameState, GameMode } from '../types/game';

const defaultSettings: GameSettings = {
  difficulty: 'normal',
  timeLimit: 60,
};

const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      gameState: 'auth',
      user: null,
      gameMode: null,
      gameSettings: defaultSettings,
      
      setGameState: (state: GameState) => 
        set({ gameState: state }),
      
      setUser: (user: User | null) => 
        set({ user: user }),
      
      setGameMode: (mode: GameMode) => 
        set({ gameMode: mode }),
      
      updateGameSettings: (settings: Partial<GameSettings>) => 
        set((state) => ({
          gameSettings: { ...state.gameSettings, ...settings }
        })),
      
      // Reset to initial state
      reset: () => 
        set({
          gameState: 'auth',
          user: null,
          gameMode: null,
          gameSettings: defaultSettings,
        }),
    }),
    {
      name: 'typing-game-storage',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true, 
      
      partialize: (state) => ({
        gameSettings: state.gameSettings,
        user: state.user,
      }),
    }
  )
);

export const useGameState = () => useGameStore((state) => state.gameState);
export const useUser = () => useGameStore((state) => state.user);
export const useGameMode = () => useGameStore((state) => state.gameMode);
export const useGameSettings = () => useGameStore((state) => state.gameSettings);

export default useGameStore;