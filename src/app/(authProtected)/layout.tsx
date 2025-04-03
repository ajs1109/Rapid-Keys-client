import AuthLayout from '@/components/layout/AuthLayout';
import type { Metadata } from "next";
import { cookies } from "next/headers";

import { verifyUser } from '@/lib/api';
import { redirect } from 'next/navigation';
import { User } from '@/types/auth';
import InitializeAuth from './InitializeAuth';
//import useStore from '@/store/useGameStore';

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Rapid Keys",
  description: "Typing Battle against your friends",
};


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  //const {setAuthUser} = useStore();
  const cookieList = await cookies();
  const accessToken = cookieList.get('access_token')?.value ?? ''
  let user: User | null = null;
  try {
    const { user: newUser } = await verifyUser(accessToken);
    if(newUser){
      user = newUser;
    }
    //setAuthUser(user);
  } catch (error) {
     console.log('error while verifyUser():', error);
  } finally{
    if(!user){
      //this redirect does not work. But assuming that code wont reach here as middleware handles it.
      redirect("/auth");
    }
  }
  return (
    <html lang="en">
      <head>
        <meta name="user-data" content="" />
      </head>
      <body className="antialiased">
        <InitializeAuth user={user}/>
        <AuthLayout children={children} user={user}/>
      </body>
    </html>
  );
}
