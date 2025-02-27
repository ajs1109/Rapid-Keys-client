'use client'

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { publicRoutes } from '@/routes';
import { User } from '@/types/auth';
import Header from './Header';
import Footer from './Footer';
import { decodeToken } from '@/utils/auth';
import { loggedInUserData, me, refreshAccessToken, refreshAuthToken } from '@/lib/api';

interface AuthLayoutProps {
  children: React.ReactNode;
  initialUser?: User | null;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, initialUser }) => {
  const [user, setUser] = useState<User | null>();

  useEffect(() => {
    //setUserFromCookie();
    

    newUser();
  }, []);
  const newUser = async () => {
    //const {user: hihi} = await refreshAccessToken();
  //refreshAuthToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7Il9pZCI6IjY3NzJmMzJiNWU0ZDBjN2Y0ZmM2NDJkYSIsInVzZXJuYW1lIjoic3BlZWR0eXBlcjEyMyIsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInBhc3N3b3JkIjoiIiwiaGlnaFNjb3JlIjowLCJnYW1lc1BsYXllZCI6MCwiY3JlYXRlZEF0IjoiMjAyNC0xMi0zMFQxOToyMzoyMy4yNTNaIiwidXBkYXRlZEF0IjoiMjAyNC0xMi0zMFQxOToyMzoyMy4yNTNaIiwiX192IjowfSwiaWF0IjoxNzM5NjM0NzM5LCJleHAiOjE3NDAyMzk1Mzl9.jdtkHkrObHZRN37SBDugyqQ1fSAxcMjm7oBfJZ81NGo');
  //setUser(hihi);
  const {user: hiUser} = await loggedInUserData();
  console.log('hiuser: ' + hiUser);
  setUser(hiUser);
  }
    

  const setUserFromCookie = async () => {
    // const cookieStore = await cookies();
    // const token = cookieStore.get('access_token')?.value;
    const token = await me();
    console.log('me token: ' + token);
    if(token){
      const decoded = await decodeToken(token);
      setUser(decoded);
    }

  }
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
      {!isPublicRoute && <Header username={user?.username} />}
      <main className={user ? 'flex-1 pt-16' : 'flex-1'}>
        {children}
      </main>
      {!isPublicRoute && <Footer />}
    </div>
  );
};

export default AuthLayout;
