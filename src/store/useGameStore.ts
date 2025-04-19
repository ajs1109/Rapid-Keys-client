// store/useGameStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameSettings, GameState, GameMode } from '../types/game';
import { User } from '@/types/auth';

interface GameStore {
  gameState: GameState;
  gameMode: GameMode | null;
  gameSettings: GameSettings;
  token: string | null;
  user: User | null;
  gamesPlayed: number;
  highestWPM: number;
  highestAccuracy: number;

  setGameState: (state: GameState) => void;
  setGameMode: (mode: GameMode) => void;
  updateGameSettings: (settings: Partial<GameSettings>) => void;
  setAuthUser: (user: User) => void;
  setAuthToken: (token: string) => void;
  setGamesPlayed: (count: number) => void;
  setHighScore: (WPM: number, Accuracy: number) => void;
  logout: () => void;
  reset: () => void;
  refreshToken: () => Promise<void>;
}

const defaultSettings: GameSettings = {
  difficulty: 'normal',
  timeLimit: 60,
};

const initialState = {
  gameState: 'auth' as GameState,
  gameMode: null,
  gameSettings: defaultSettings,
  token: null,
  user: null,
  gamesPlayed: 0,
  highestWPM: 0,
  highestAccuracy: 0
};

// Export the store creation function separately
export const createGameStore = (preloadedState: Partial<GameStore> = {}) => {
  return create<GameStore>()(
    persist(
      (set) => ({
        ...initialState,
        ...preloadedState,

        setGameState: (state) => set({ gameState: state }),

        setGameMode: (mode) => set({ gameMode: mode }),

        updateGameSettings: (settings) =>
          set((state) => ({
            gameSettings: { ...state.gameSettings, ...settings },
          })),

        setAuthUser: (user) =>
          set({
            user,
            gameState: 'menu',
          }),
  
        setAuthToken: (token) =>
          set({
            token
          }),

        setGamesPlayed: (count) => set({gamesPlayed: count}),

        setHighScore: (WPM, Accuracy) => set({highestWPM: WPM, highestAccuracy: Accuracy}),

        logout: async () => {
          document.cookie = "access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 UTC;";
        },

        reset: () => set(initialState),

        refreshToken: async () => {
          try {
            const response = await fetch('/api/auth/refresh', {
              method: 'POST',
              credentials: 'include',
            });

            if (!response.ok) throw new Error('Failed to refresh token');

            const data = await response.json();
            set({
              token: data.accessToken,
              user: data.user,
            });
          } catch (error) {
            console.error('Token refresh failed:', error);
            set({
              token: null,
              user: null,
            });
          }
        },
      }),
      {
        name: 'rapid-keys-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          gameSettings: state.gameSettings,
          token: state.token,
          user: state.user,
        }),
      }
    )
  );
};

// Create the default store instance
const useGameStore = createGameStore();

// Export functions to initialize and use the store
export const initializeStore = (preloadedState: Partial<GameStore>) => {
  useGameStore.setState(preloadedState);
};

export default useGameStore;
// export const useGameState = () => useStore((state) => state.gameState);
// export const useGameMode = () => useStore((state) => state.gameMode);
// export const useGameSettings = () => useStore((state) => state.gameSettings);
// export const useIsPublicRoute = () => useStore((state) => state.isPublicRoute);   

