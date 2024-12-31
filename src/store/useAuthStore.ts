import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: any;
  token: string | null;
  setAuth: (user: any, token: string) => void;
  clearAuth: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore;