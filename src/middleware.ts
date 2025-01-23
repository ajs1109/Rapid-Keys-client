import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeToken } from '@/lib/utils/auth';
import { publicRoutes } from './routes';

export async function middleware(request: NextRequest) {
  console.log('middleware activated');
  const authToken = request.cookies.get('auth_token')?.value;
  let isAuthenticated = false;
  let userData = null;

  if (authToken) {
    const decoded = await decodeToken(authToken);
    if (decoded) {
      isAuthenticated = true;
      userData = decoded;
    }
  }
  const path = request.nextUrl.pathname;
  console.log('path:', path);
  const isAuthPath = publicRoutes.includes(path);
  const isEmptyPath = path === '/';

  if (!isAuthenticated && !isAuthPath) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  if (isAuthenticated && (isAuthPath || isEmptyPath)) {
    return NextResponse.redirect(new URL('/menu', request.url));
  }

  // Clone the response to modify headers
  const response = NextResponse.next();
  
  // Add user data to response headers if authenticated
  if (isAuthenticated && userData) {
    response.headers.set(
      'x-user-data', 
      JSON.stringify({
        id: userData.id,
        username: userData.username,
        email: userData.email
      })
    );
  }

  return response;
}

export const config = {
  matcher: ['/auth', '/menu', '/single-player', '/multi-player', '/'],
};