import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import AuthLayout from '@/components/layout/AuthLayout';
import { decodeToken } from '@/utils/auth'
import { AuthSync } from "@/utils/AuthSync";
import PageLoader from "@/components/PageLoader";
import { Toaster } from "sonner";

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
  const cookieStore = await cookies();
  const authToken = cookieStore.get('access_token')?.value;
  console.log('auth token:', authToken);
  let initialUser = null;
  // cookieStore.set
  // const {user} = await refreshAccessToken();
  // initialUser = user;
  // console.log('initial user:', initialUser);
  // if (authToken) {
  //   const decoded = await decodeToken(authToken);
  //   console.log('dd',decoded);
  //   if (decoded) {
  //     initialUser = decoded;

  //     console.log('initial users:',initialUser);
  //   }
  // }

  return (
    <html lang="en">
      <head>
        <meta name="user-data" content="" />
      </head>
      <body className="antialiased">
        <Toaster position="top-right"/>
      <AuthSync />
        <AuthLayout initialUser={initialUser}>{children}</AuthLayout>
      </body>
    </html>
  );
}
