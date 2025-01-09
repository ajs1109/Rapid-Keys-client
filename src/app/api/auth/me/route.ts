// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeToken } from '@/utils/auth';

export async function GET(request: NextRequest) {
  try {
    const authToken = (await cookies()).get('auth_token')?.value;
    
    if (!authToken) {
      return NextResponse.json(null, { status: 401 });
    }

    const userData = await decodeToken(authToken);
    if (!userData) {
      return NextResponse.json(null, { status: 401 });
    }

    return NextResponse.json({
      id: userData.id,
      username: userData.username,
      email: userData.email
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json(null, { status: 401 });
  }
}