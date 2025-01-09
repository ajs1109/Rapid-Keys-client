import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import User from '@/models/user';
import { generateToken, handleMongoError } from '@/utils/auth';
import { dbConnect } from '@/utils/dbConnect';

interface LoginRequestBody {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json() as LoginRequestBody;
    const { email, password } = body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' }, 
        { status: 401 }
      );
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' }, 
        { status: 401 }
      );
    }
    
    const token = generateToken({
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      });

    // Set HTTP-only cookie
    (await cookies()).set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });
    
    const response: LoginResponse = {
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = handleMongoError(error).message;
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 400 }
    );
  }
}

// Optionally add a GET method to check login status
export async function GET() {
  try {
    const authToken = (await cookies()).get('auth_token');
    return NextResponse.json({ 
      isAuthenticated: !!authToken 
    });
  } catch (error) {
    return NextResponse.json({ 
      isAuthenticated: false 
    });
  }
}