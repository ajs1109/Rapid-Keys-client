// components/AuthSync.tsx
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export function AuthSync() {
  const { setUser, setLoading } = useAuthStore();

  const syncUserData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
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

  return null;
}