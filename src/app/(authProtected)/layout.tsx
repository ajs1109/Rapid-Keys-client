import React from 'react';
import Header from './header';
import Footer from './footer';
import { verifyUser } from '@/lib/api';
import { useAuthStore } from '@/store/useGameStore';
import { User } from '@/types/auth';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = async ({ children }) => {
  let user: User | null | undefined = await verifyUser();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user}/>
      <main className='flex-1 pt-16'>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default AuthLayout;