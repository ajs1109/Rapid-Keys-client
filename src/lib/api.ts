import { authApi } from '@/store/useGameStore';

export const login = async (email: string, password: string) => {
  return authApi.login(email, password);
};

export const signUp = async (username: string, email: string, password: string) => {
  return authApi.signUp(username, email, password);
};

export const logout = async () => {
  return authApi.logout();
};