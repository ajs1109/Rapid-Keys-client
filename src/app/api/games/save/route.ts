import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/user';
import { verifyAuth, handleMongoError } from '@/utils/auth';
import dbConnect from '@/utils/dbConnect';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Please authenticate' }, { status: 401 });
    }
    
    await dbConnect();
    
    const body = await request.json();
    const user = await User.findById(auth.userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    user.gamesPlayed += 1;
    if (body.score > user.highScore) {
      user.highScore = body.score;
    }
    
    await user.save();
    
    return NextResponse.json({
      highScore: user.highScore,
      gamesPlayed: user.gamesPlayed
    });
  } catch (error) {
    const errorMessage = handleMongoError(error).message;
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}