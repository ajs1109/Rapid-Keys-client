import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import AuthLayout from '@/components/layout/AuthLayout';
import { decodeToken } from '@/utils/auth'
import { AuthSync } from "@/utils/AuthSync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
  const authToken = cookieStore.get('auth_token')?.value;
  let initialUser = null;

  if (authToken) {
    const decoded = await decodeToken(authToken);
    if (decoded) {
      initialUser = decoded;
    }
  }

  return (
    <html lang="en">
      <head>
        <meta name="user-data" content="" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <AuthSync />
        <AuthLayout initialUser={initialUser}>{children}</AuthLayout>
      </body>
    </html>
  );
}
