import { NextRequest, NextResponse } from 'next/server';
import { User } from './types/auth';
import { verifyUser } from './lib/api';
import { publicRoutes } from './routes';
//import useStore from './store/useGameStore';

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;
  let isAuthenticated = false;
  let userData: User | null = null;
  try {
    const { user } = await verifyUser(accessToken ?? '');
  if(user){
    isAuthenticated = true;
    userData = user;
    //setAuthUser(user);
    console.log('found user', user);
  }
  else{
    console.log('no user foundd');
  } 
  } catch (error) {
    console.log('no user found error');
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
  return NextResponse.next();
}

export const config = {
  matcher: ['/auth', '/menu', '/single-player', '/multi-player', '/'],
};
