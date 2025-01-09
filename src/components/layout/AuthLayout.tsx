'use client'

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { publicRoutes } from '@/routes';
import { User } from '@/types/auth';
import Header from './Header';
import Footer from './Footer';

interface AuthLayoutProps {
  children: React.ReactNode;
  initialUser?: User | null;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, initialUser }) => {
  const { user } = useAuthStore();
  console.log('from auth layout:', user);
  const router = useRouter();
  const pathname = usePathname();
  const isPublicRoute = publicRoutes.includes(pathname);

  // useEffect(() => {
  //   const initializeAuth = async () => {
  //     if (initialUser) {
  //       setUser(initialUser);
  //     } else {
  //       const validatedUser = await authService.validateToken();
  //       console.log('::', validatedUser);
  //       setUser(validatedUser);
  //     }
  //   };

  //   initializeAuth();
  // }, [initialUser, setUser]);

//   if (isLoading) {
//     return <div>Loading...</div>; // Replace with your loading component
//   }

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
