// services/authService.ts
import { AuthResponse, User } from '../types/auth';
import { apiService } from './apiService';
import { authUtils } from '../utils/auth';

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await apiService.post<AuthResponse>('/auth/login', { email, password });
      return response;
    } catch (error: any) {
      console.error('Login failed:', error.message || error);
      throw new Error(error.message || 'An unexpected error occurred during login.');
    }
  },

  signup: async (username: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await apiService.post<Response>('/auth/signup', { username, email, password });
    return authUtils.handleAuthResponse(response);
  },

  logout: async (): Promise<void> => {
    await apiService.post<void>('/auth/logout');
    authUtils.removeAuthCookie();
  },

  validateToken: async (): Promise<User | null> => {
    try {
      const user = await apiService.get<User>('/auth/validate');
      return user;
    } catch (error) {
      return null;
    }
  },
};
