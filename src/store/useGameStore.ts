import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameSettings, GameState, GameMode } from '../types/game';
import { publicRoutes } from '../routes';
import React from 'react';
import { decodeToken } from '@/utils/auth';

interface User {
  id: string;
  username: string;
  email: string;
}

interface GameStore {
  gameState: GameState;
  gameMode: GameMode | null;
  gameSettings: GameSettings;
  token: string | null;
  user: User | null;
  isPublicRoute: boolean;

  setGameState: (state: GameState) => void;
  setGameMode: (mode: GameMode) => void;
  updateGameSettings: (settings: Partial<GameSettings>) => void;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  reset: () => void;
  setIsPublicRoute: (value: boolean) => void;
  refreshToken: () => Promise<void>; // Add method to refresh access token
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
  isPublicRoute: true, // Default to true, will be updated in useEffect
};

const useStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setGameState: (state) => set({ gameState: state }),

      setGameMode: (mode) => set({ gameMode: mode }),

      updateGameSettings: (settings) =>
        set((state) => ({
          gameSettings: { ...state.gameSettings, ...settings },
        })),

      setAuth: (user, token) =>
        set({
          user,
          token,
          gameState: 'menu',
        }),

      setIsPublicRoute: (value) => set({ isPublicRoute: value }),

      logout: async () => {
        try {
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
            gameSettings: defaultSettings,
          });
        } catch (error) {
          console.error('Logout error:', error);
          // Still clear local state even if API call fails
          set({
            ...initialState,
            gameSettings: defaultSettings,
          });
        }
      },

      reset: () => set(initialState),

      // Method to refresh access token using refresh_token
      refreshToken: async () => {
        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include', // Include cookies
          });

          if (!response.ok) {
            throw new Error('Failed to refresh token');
          }

          const data = await response.json();
          const { accessToken, user } = data;

          set({
            token: accessToken,
            user,
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
      name: 'game-storage',
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        gameSettings: state.gameSettings,
        token: state.token,
        user: state.user,
      }),
    }
  )
);

// Custom hook to handle route checking
export const useRouteCheck = () => {
  const setIsPublicRoute = useStore((state) => state.setIsPublicRoute);

  React.useEffect(() => {
    const pathname = window.location.pathname;
    const isPublic = publicRoutes.includes(pathname);
    setIsPublicRoute(isPublic);
  }, []);
};

// Custom hook to initialize user data from refresh_token
export const useInitializeAuth = () => {
  console.log('into useInitializeAuth');
  const setAuth = useStore((state) => state.setAuth);
  const refreshToken = useStore((state) => state.refreshToken);

  React.useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Fetch refresh_token from cookies
        const refreshTokenCookie = document.cookie
          .split('; ')
          .find((row) => row.startsWith('refresh_token='))
          ?.split('=')[1];

        if (refreshTokenCookie) {
          console.log('refresh token:', refreshTokenCookie);
          const decoded = await decodeToken(refreshTokenCookie);
          if (decoded) {
            setAuth(decoded, refreshTokenCookie);
          } else {
            console.log('refreshing access token in useInitializeAuth');
            // Attempt to refresh the access token
            await refreshToken();
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      }
    };

    initializeAuth();
  }, []);
};

export const useAuth = () =>
  useStore((state) => ({
    user: state.user,
    token: state.token,
    isAuthenticated: state.token !== null,
    setAuth: state.setAuth,
    logout: state.logout,
  }));

export const useGameState = () => useStore((state) => state.gameState);
export const useGameMode = () => useStore((state) => state.gameMode);
export const useGameSettings = () => useStore((state) => state.gameSettings);
export const useIsPublicRoute = () => useStore((state) => state.isPublicRoute);

export default useStore;