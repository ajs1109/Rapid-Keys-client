import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const gameStore = request.cookies.get('typing-game-storage')?.value
  let user = null;
  let gameMode = null;

  try {
    const state = gameStore ? JSON.parse(gameStore).state : null;
    user = state?.user;
    gameMode = state?.gameMode;
  } catch (error) {
    console.error('Error parsing game state:', error);
  }

  const path = request.nextUrl.pathname;
  const isAuthPath = path === '/auth';
  const isModeSelectPath = path === '/mode-select';
  const isSinglePlayerPath = path === '/single-player';
  const isMultiPlayerPath = path === '/multi-player';

  if (!user && !isAuthPath) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  if (user && isAuthPath) {
    return NextResponse.redirect(new URL('/mode-select', request.url));
  }

  if (user && !gameMode && !isModeSelectPath && !isAuthPath) {
    return NextResponse.redirect(new URL('/mode-select', request.url));
  }

  // Single player protection
  if (isSinglePlayerPath && gameMode !== 'single') {
    return NextResponse.redirect(new URL('/mode-select', request.url));
  }

  // Multi player protection
  if (isMultiPlayerPath && gameMode !== 'multi') {
    return NextResponse.redirect(new URL('/mode-select', request.url));
  }

  return NextResponse.next();
}

// Specify which routes middleware applies to
export const config = {
  matcher: [
    '/auth',
    '/mode-select', 
    '/single-player',
    '/multi-player',
    '/'
  ]
}