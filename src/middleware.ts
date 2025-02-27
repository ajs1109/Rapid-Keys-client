import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeToken } from '@/utils/auth';
import { publicRoutes } from '@/routes';
import { refreshAccToken } from '@/lib/api';
import { User } from './types/auth';

export async function middleware(request: NextRequest) {
  console.log('middleware activated');

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  let isAuthenticated = false;
  let userData: User | null = null;

  if(refreshToken){
    console.log('refresh token:', refreshToken);
    try {
      var decoded =await decodeToken(refreshToken);
      if(decoded !== null){
      isAuthenticated = true;
      userData = decoded;
      }
    } catch (error) {
      console.log('Refresh token expired or invalid:', error);
    }
  }

  const path = request.nextUrl.pathname;
  const isAuthPath = publicRoutes.includes(path);
  const isEmptyPath = path === '/';
  console.log('path:', path, isAuthenticated, isAuthPath, userData);
  if (!isAuthenticated && !isAuthPath) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  if (isAuthenticated && (isAuthPath || isEmptyPath)) {
    return NextResponse.redirect(new URL('/menu', request.url));
  }

  const response = NextResponse.next();

  if (isAuthenticated && userData) {
    response.headers.set(
      'x-user-data',
      JSON.stringify({
        id: userData.id,
        username: userData.username,
        email: userData.email,
      })
    );
  }

  return response;
}

export const config = {
  matcher: ['/auth', '/menu', '/single-player', '/multi-player', '/'],
};
