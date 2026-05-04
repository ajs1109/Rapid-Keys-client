'use client'

import { User } from '@/types/auth';
import React, { useEffect, useState } from 'react';
import Header from './Header';
import SideNav from './SideNav';
import ChatDrawer from './ChatDrawer';
import useStore from '@/store/useGameStore';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { SocketProvider } from '@/context/SocketContext';

interface AuthLayoutProps {
  children: React.ReactNode;
  user: User;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, user }) => {
  const { setAuthUser, setGamesPlayed, setHighScore, user: userZ } = useStore();
  const pathname = usePathname();
  // Hide sidebar on game pages so user gets full-width focus
  const isGamePage = pathname === '/single-player' || pathname?.startsWith('/multi-player');
  const [sidebarOverlay, setSidebarOverlay] = useState(false);

  useEffect(() => {
    // Close overlay sidebar when navigating away from game pages
    if (!isGamePage) setSidebarOverlay(false);
  }, [isGamePage]);

  useEffect(() => {
    setAuthUser(user);
    setGamesPlayed(user.gamesPlayed);
    setHighScore(user.highestWPM, user.highestAccuracy);
  }, [setAuthUser, setGamesPlayed, setHighScore, user]);

  if (!userZ) return null;

  return (
    <SocketProvider>
      <div className="min-h-screen bg-background">
        {/* Subtle ambient gradients */}
        <div className="fixed inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-secondary/5 pointer-events-none z-0" />
        <div className="fixed inset-0 particle-bg pointer-events-none z-0" />

        <Header />

        {/* Sidebar: normal on non-game pages, overlay on game pages */}
        {!isGamePage && <SideNav />}
        {isGamePage && sidebarOverlay && (
          <SideNav asOverlay onClose={() => setSidebarOverlay(false)} />
        )}

        {/* Pull-tab to reopen sidebar on game pages */}
        {isGamePage && !sidebarOverlay && (
          <button
            onClick={() => setSidebarOverlay(true)}
            title="Open sidebar"
            className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-slate-900/80 backdrop-blur-sm border border-white/10 border-l-0 rounded-r-lg px-1 py-3 text-on-surface-variant hover:text-secondary hover:bg-slate-800/90 transition-all shadow-lg"
          >
            <ChevronRight size={16} />
          </button>
        )}

        <main className={`${isGamePage ? '' : 'ml-64'} pt-20 min-h-screen relative z-10`}>
          {children}
        </main>

        <ChatDrawer />
      </div>
    </SocketProvider>
  );
};

export default AuthLayout;

