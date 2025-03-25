import type { Metadata } from "next";
import { cookies } from "next/headers";
import { verifyUser } from '@/lib/api';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: "Rapid Keys",
  description: "Typing Battle against your friends",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieList = await cookies();
  const accessToken = cookieList.get('access_token')?.value ?? '';
  try {
    const { user } = await verifyUser(accessToken);
    if(user){
        console.log('user found in public layout');
        //this redirect does not work. But assuming that code wont reach here as middleware handles it.
        return redirect("/menu");
    }
  } catch (error) {
     console.log('error while verifyUser():', error);
  }
  return (
    <html lang="en">
      <head>
        <meta name="user-data" content="" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
