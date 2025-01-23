import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameSettings, GameState, GameMode } from '../lib/types/game';
import { publicRoutes } from '../routes';
import { useEffect } from 'react';

interface GameStore {
  gameState: GameState;
  gameMode: GameMode | null;
  gameSettings: GameSettings;
  
  setGameState: (state: GameState) => void;
  setGameMode: (mode: GameMode) => void;
  updateGameSettings: (settings: Partial<GameSettings>) => void;
  reset: () => void;
}

const defaultSettings: GameSettings = {
  difficulty: 'normal',
  timeLimit: 60,
};

const initialState = {
  gameState: 'auth' as GameState,
  gameMode: null,
  gameSettings: defaultSettings,
};


const useStore = create<GameStore>()(
  persist(
    (set) => ({
      ...initialState,

      setGameState: (state) => 
        set({ gameState: state }),
      
      setGameMode: (mode) => 
        set({ gameMode: mode }),
      
      updateGameSettings: (settings) =>
        set((state) => ({
          gameSettings: { ...state.gameSettings, ...settings }
        })),

      logout: async () => {
        try {
          console.log('into logout endpoint');
          const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include', // Important for cookie handling
          });
      
          if (!response.ok) {
            throw new Error('Logout failed');
          }
      
          // Clear local state
          set({ 
            ...initialState,
            gameSettings: defaultSettings
          });
      
        } catch (error) {
          console.error('Logout error:', error);
          // Still clear local state even if API call fails
          set({ 
            ...initialState,
            gameSettings: defaultSettings
          });
        }
      },

      reset: () => set(initialState),
    }),
    {
      name: 'game-storage',
      storage: createJSONStorage(() => localStorage),
      
      partialize: (state) => ({
        gameSettings: state.gameSettings
      }),
    }
  )
);

// Custom hook to handle route checking
export const useRouteCheck = () => {

  useEffect(() => {
    const pathname = window.location.pathname;
    const isPublic = publicRoutes.includes(pathname);
  }, []); // Empty dependency array means this runs once after mount
};

// Rest of your auth API utilities...
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    return data;
  },

  signUp: async (username: string, email: string, password: string) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    const data = await response.json();
    return data;
  },

  logout: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
  
      if (!response.ok) {
        throw new Error('Logout failed');
      }
  
      return response;
  }
};

export const useGameState = () => useStore((state) => state.gameState);
export const useGameMode = () => useStore((state) => state.gameMode);
export const useGameSettings = () => useStore((state) => state.gameSettings);

export default useStore;