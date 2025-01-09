import { AuthResponse, User } from '../types/auth';
import { authUtils } from '../utils/auth';

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return authUtils.handleAuthResponse(response);
  },

  signup: async (username: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    return authUtils.handleAuthResponse(response);
  },

  logout: async (): Promise<void> => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Logout failed');
    }
    authUtils.removeAuthCookie();
  },

  validateToken: async (): Promise<User | null> => {
    try {
      const response = await fetch('/api/auth/validate', {
        credentials: 'include',
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.user;
    } catch (error) {
      return null;
    }
  }
};
