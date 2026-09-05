import { db } from "@/db";
import { friends, friendRequests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserFromToken } from "@/utils/auth";
import { NextRequest, NextResponse } from "next/server";

// PUT /api/friends/respond: accept or decline a friend request
// Body: { fromUserId: string, action: 'accept' | 'decline' }
export async function PUT(req: NextRequest) {
  const token = req.cookies?.get("access_token")?.value;
  const { message, user, status } = await getUserFromToken(token ?? '');
  if (!user) return NextResponse.json({ message }, { status });

  const body = await req.json();
  const fromUserId: string = body.fromUserId;
  const action: 'accept' | 'decline' = body.action;

  if (!fromUserId || !['accept', 'decline'].includes(action)) {
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  }

  // Remove from current user's friendRequests
  await db.delete(friendRequests)
    .where(
      and(
        eq(friendRequests.senderId, fromUserId),
        eq(friendRequests.receiverId, user.id)
      )
    );

  if (action === 'accept') {
    // Check if they are already friends
    const [existingFriendship] = await db
      .select()
      .from(friends)
      .where(
        and(
          eq(friends.userId, user.id),
          eq(friends.friendId, fromUserId)
        )
      );
    if (!existingFriendship) {
      await db.insert(friends).values([
        { userId: user.id, friendId: fromUserId },
        { userId: fromUserId, friendId: user.id }
      ]);
    }
    return NextResponse.json({ message: 'Friend added!' });
  }

  return NextResponse.json({ message: 'Request declined' });
}
