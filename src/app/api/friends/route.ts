import { db } from "@/db";
import { users, friends, friendRequests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserFromToken } from "@/utils/auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/friends: returns { friends, requests } both as { id, username }[]
export async function GET(req: NextRequest) {
  const token = req.cookies?.get("access_token")?.value;
  const { message, user, status } = await getUserFromToken(token ?? '');
  if (!user) return NextResponse.json({ message }, { status });

  // Fetch friends of current user
  const userFriends = await db
    .select({
      id: users.id,
      username: users.username,
    })
    .from(friends)
    .innerJoin(users, eq(users.id, friends.friendId))
    .where(eq(friends.userId, user.id));

  // Fetch friend requests received by current user
  const userRequests = await db
    .select({
      id: users.id,
      username: users.username,
    })
    .from(friendRequests)
    .innerJoin(users, eq(users.id, friendRequests.senderId))
    .where(eq(friendRequests.receiverId, user.id));

  return NextResponse.json({ friends: userFriends, requests: userRequests });
}

// POST /api/friends: send a friend request { targetUsername }
export async function POST(req: NextRequest) {
  const token = req.cookies?.get("access_token")?.value;
  const { message, user, status } = await getUserFromToken(token ?? '');
  if (!user) return NextResponse.json({ message }, { status });

  const body = await req.json();
  const targetUsername: string = body.targetUsername;
  if (!targetUsername?.trim()) return NextResponse.json({ message: 'Username required' }, { status: 400 });
  if (targetUsername === user.username) return NextResponse.json({ message: "You can't add yourself" }, { status: 400 });

  const [target] = await db.select().from(users).where(eq(users.username, targetUsername));
  if (!target) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  // Check if they are already friends
  const [existingFriendship] = await db
    .select()
    .from(friends)
    .where(
      and(
        eq(friends.userId, user.id),
        eq(friends.friendId, target.id)
      )
    );
  if (existingFriendship) {
    return NextResponse.json({ message: 'Already friends!' }, { status: 400 });
  }

  // Check if a friend request was already sent by user to target
  const [existingRequest] = await db
    .select()
    .from(friendRequests)
    .where(
      and(
        eq(friendRequests.senderId, user.id),
        eq(friendRequests.receiverId, target.id)
      )
    );
  if (existingRequest) {
    return NextResponse.json({ message: 'Request already sent' }, { status: 400 });
  }

  // Check if target already sent a request to user (auto-accept)
  const [incomingRequest] = await db
    .select()
    .from(friendRequests)
    .where(
      and(
        eq(friendRequests.senderId, target.id),
        eq(friendRequests.receiverId, user.id)
      )
    );

  if (incomingRequest) {
    // Delete friend request
    await db.delete(friendRequests)
      .where(
        and(
          eq(friendRequests.senderId, target.id),
          eq(friendRequests.receiverId, user.id)
        )
      );

    // Insert mutual friendships
    await db.insert(friends).values([
      { userId: user.id, friendId: target.id },
      { userId: target.id, friendId: user.id }
    ]);

    return NextResponse.json({ message: 'You are now friends!' });
  }

  // Otherwise, insert a new friend request
  await db.insert(friendRequests).values({
    senderId: user.id,
    receiverId: target.id,
  });

  return NextResponse.json({ message: 'Friend request sent!', targetId: target.id });
}
