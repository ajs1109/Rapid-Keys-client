// components/layout/Layout.tsx
'use client'

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import useStore from '@/store/useGameStore';
import { publicRoutes } from '@/routes';

interface LayoutProps {
  children: React.ReactNode;
  initialUser?: {
    id: string;
    username: string;
    email: string;
  } | null;
}

const Layout: React.FC<LayoutProps> = ({ children, initialUser }) => {
  const { setAuth, user } = useStore();
  
  useEffect(() => {
    if (initialUser) {
     setAuth(initialUser, '');
    }
  }, [initialUser, setAuth]);

  return (
    !initialUser ? 
      <>{children}</>
    : <div className="min-h-screen flex flex-col">
        <Header username={user?.username}/>
          <main className="flex-1 pt-16">
            {children}
          </main>
        <Footer />
      </div>
  );
};

export default Layout;