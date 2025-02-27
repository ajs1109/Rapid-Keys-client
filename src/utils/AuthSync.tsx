// components/AuthSync.tsx
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useInitializeAuth } from '@/store/useGameStore';
import { loggedInUserData } from '@/lib/api';

export function AuthSync() {
  const { setUser, setLoading } = useAuthStore();

  const syncUserData = async () => {
    setLoading(true);
    try {
        const {user: hiUser} = await loggedInUserData();
        setUser(hiUser || null);
        
    } catch (error) {
      console.error('Error syncing user data:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncUserData();

    // Listen for custom login event
    window.addEventListener('auth-state-changed', syncUserData);
    
    return () => {
      window.removeEventListener('auth-state-changed', syncUserData);
    };
  }, []);
  useInitializeAuth();
  return null;
}