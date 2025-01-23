'use client'

import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/lib/types/auth';
import Header from './Header';
import Footer from './Footer';

interface AuthLayoutProps {
  children: React.ReactNode;
  initialUser?: User | null;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, initialUser }) => {
  const { setUser, setLoading, user } = useAuthStore();
  
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
  
      window.addEventListener('auth-state-changed', syncUserData);
      
      return () => {
        window.removeEventListener('auth-state-changed', syncUserData);
      };
    }, []);
  
  return (
    <div className="min-h-screen flex flex-col">
      {user && <Header username={user.username} />}
      <main className={user ? 'flex-1 pt-16' : 'flex-1'}>
        {children}
      </main>
      {user && <Footer />}
    </div>
  );
};

export default AuthLayout;
