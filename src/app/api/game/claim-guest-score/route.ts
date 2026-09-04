import { db } from '@/db';
import { users } from '@/db/schema';
import { getUserFromToken } from '@/utils/auth';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;
  if (!accessToken) {
    return NextResponse.json({ message: 'Log in to save this score', success: false }, { status: 401 });
  }

  const { user, message, status } = await getUserFromToken(accessToken);
  if (!user) {
    return NextResponse.json({ message, success: false }, { status });
  }

  const body = await request.json();
  const wpm = Math.round(Number(body?.wpm));
  const accuracy = Math.round(Number(body?.accuracy));

  if (!Number.isFinite(wpm) || !Number.isFinite(accuracy) || wpm < 0 || wpm > 400 || accuracy < 0 || accuracy > 100) {
    return NextResponse.json({ message: 'That typing result is not valid', success: false }, { status: 400 });
  }

  const currentScore = user.highestWpm * user.highestAccuracy;
  const guestScore = wpm * accuracy;
  const updateData: Partial<typeof users.$inferInsert> = {
    gamesPlayed: user.gamesPlayed + 1,
    updatedAt: new Date(),
  };

  if (guestScore > currentScore || (guestScore === currentScore && wpm > user.highestWpm)) {
    updateData.highestWpm = wpm;
    updateData.highestAccuracy = accuracy;
  }

  await db.update(users).set(updateData).where(eq(users.id, user.id));

  return NextResponse.json({ message: 'Guest score saved', success: true });
}
