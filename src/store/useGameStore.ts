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
  gamesPlayed: 0,
  highestWPM: 0,
  highestAccuracy: 0
};

const useStore = create<GameStore>()(
  persist(
    (set) => ({
      ...initialState,

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
// Custom hook to handle route checking
// export const useRouteCheck = () => {
//   const setIsPublicRoute = useStore((state) => state.setIsPublicRoute);

//   React.useEffect(() => {
//     const pathname = window.location.pathname;
//     const isPublic = publicRoutes.includes(pathname);
//     setIsPublicRoute(isPublic);
//   }, []);
// };

// // Custom hook to initialize user data from refresh_token
// export const useInitializeAuth = () => {
//   console.log('into useInitializeAuth');
//   const setAuthUser = useStore((state) => state.setAuthUser);
//   const setAuthToken = useStore((state) => state.setAuthToken);
//   const refreshToken = useStore((state) => state.refreshToken);

//   React.useEffect(() => {
//     const initializeAuth = async () => {
//       try {
//         // Fetch refresh_token from cookies
//         const refreshTokenCookie = document.cookie
//           .split('; ')
//           .find((row) => row.startsWith('refresh_token='))
//           ?.split('=')[1];

//         if (refreshTokenCookie) {
//           console.log('refresh token:', refreshTokenCookie);
//           const decoded = await decodeToken(refreshTokenCookie);
//           if (decoded) {
//             setAuthUser(decoded);
//             setAuthToken(refreshTokenCookie);
//           } else {
//             console.log('refreshing access token in useInitializeAuth');
//             // Attempt to refresh the access token
//             await refreshToken();
//           }
//         }
//       } catch (error) {
//         console.error('Failed to initialize auth:', error);
//       }
//     };

//     initializeAuth();
//   }, []);
// };

//export const useAuth = () =>
  // useStore((state) => ({
  //   user: state.user,
  //   token: state.token,
  //   isAuthenticated: state.token !== null,
  //   setAuthUser: state.setAuthUser,
  //   setAuthToken: state.setAuthToken,
  //   logout: state.logout,
  // }));

  export default useStore;
// export const useGameState = () => useStore((state) => state.gameState);
// export const useGameMode = () => useStore((state) => state.gameMode);
// export const useGameSettings = () => useStore((state) => state.gameSettings);
// export const useIsPublicRoute = () => useStore((state) => state.isPublicRoute);   

