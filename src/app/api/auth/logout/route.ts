// app/api/auth/logout/route.ts
import { useAuthStore } from '@/store/authStore';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  // Get the cookies instance
  const cookieStore = await cookies();
  
  // Remove the auth_token cookie
  cookieStore.delete('auth_token');
    console.log('deleted auth token');
  return NextResponse.json(
    { message: 'Logged out successfully' },
    {
      status: 200,
      headers: {
        // Set cookie with expired date
        'Set-Cookie': 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict'
      }
    }
  );
}