import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameSettings, GameState, GameMode } from '../types/game';
import { publicRoutes } from '../routes';

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
  isPublicRoute: true // Default to true, will be updated in useEffect
};

const removeAuthCookie = () => {
  document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
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

      setAuth: (user, token) =>
        set({ 
          user, 
          token,
          gameState: 'menu' 
        }),

      setIsPublicRoute: (value) =>
        set({ isPublicRoute: value }),

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
    useStore.getState().setAuth(data.user, data.token);
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
    useStore.getState().setAuth(data.user, data.token);
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
  
      useStore.getState().logout();
      return response;
  }
};

export const useAuth = () => useStore((state) => ({
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