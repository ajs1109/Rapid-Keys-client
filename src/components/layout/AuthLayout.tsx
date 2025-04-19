'use client'

import { loggedInUserData } from '@/lib/api';
import { publicRoutes } from '@/routes';
import { User } from '@/types/auth';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Footer from './Footer';
import Header from './Header';
import useStore from '@/store/useGameStore';

interface AuthLayoutProps {
  children: React.ReactNode;
  user: User;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, user }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header username={user?.username} />
      <main className={user ? 'flex-1 pt-16' : 'flex-1'}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default AuthLayout;
