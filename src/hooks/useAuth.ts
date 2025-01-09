import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authService } from '../services/authService';

export const useAuth = () => {
  const router = useRouter();
  const { user, isLoading, isInitialized, setUser, setIsLoading, setIsInitialized } = useAuthStore();

  const login = async (email: string, password: string) => {
    try {
        console.log('loginnn');
      setIsLoading(true);
      const { user, token } = await authService.login(email, password);
      setUser(user);
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    try {
        console.log('loginnn');
      setIsLoading(true);
      const { user, token } = await authService.signup(username, email, password);
      setUser(user);
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
        console.log('loginnn');
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    isInitialized,
    login,
    signup,
    logout,
    setUser
  };
};