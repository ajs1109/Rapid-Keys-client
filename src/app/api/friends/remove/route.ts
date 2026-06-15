import { db } from "@/db";
import { friends } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { getUserFromToken } from "@/utils/auth";
import { NextRequest, NextResponse } from "next/server";

// POST /api/friends/remove  { friendId }
export async function POST(req: NextRequest) {
  const token = req.cookies?.get("access_token")?.value;
  const { message, user, status } = await getUserFromToken(token ?? '');
  if (!user) return NextResponse.json({ message }, { status });

  const body = await req.json();
  const friendId: string = body.friendId;
  if (!friendId) return NextResponse.json({ message: 'friendId required' }, { status: 400 });

  // Remove bidirectionally
  await db.delete(friends)
    .where(
      or(
        and(eq(friends.userId, user.id), eq(friends.friendId, friendId)),
        and(eq(friends.userId, friendId), eq(friends.friendId, user.id))
      )
    );

  return NextResponse.json({ message: 'Friend removed' });
}
