// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DecodedToken } from '@/types/auth';

interface AuthState {
  user: DecodedToken | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  setUser: (user: DecodedToken | null) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setAuthenticating: (authenticating: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true, // Initial loading state
      isAuthenticating: false,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      setLoading: (loading) => set({ isLoading: loading }),
      setAuthenticating: (authenticating) => set({ isAuthenticating: authenticating }),
    }),
    {
      name: 'auth-storage',
    }
  )
);