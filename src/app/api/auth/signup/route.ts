import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/user';
import { generateToken, handleMongoError } from '@/utils/auth';
import dbConnect from '@/utils/dbConnect';
import { cookies } from 'next/headers';
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { username, email, password } = body;
    
    const user = new User({ username, email, password });
    await user.save();
    
    const token = generateToken(user._id.toString());
    
        (await cookies()).set('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60, // 7 days
          path: '/'
        });

    return NextResponse.json({
      token,
      user: {
        id: user._id,
        username,
        email
      }
    }, { status: 201 });
  } catch (error) {
    const errorMessage = handleMongoError(error).message;
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
