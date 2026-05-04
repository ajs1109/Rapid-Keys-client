import { dbConfig } from "@/dbConfig/dbConfig";
import { getUserFromToken } from "@/utils/auth";
import UserModel from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

dbConfig.connect();

// PUT /api/friends/respond — accept or decline a friend request
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

  let fromOId: mongoose.Types.ObjectId;
  try {
    fromOId = new mongoose.Types.ObjectId(fromUserId);
  } catch {
    return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
  }

  // Remove from current user's friendRequests
  user.friendRequests = user.friendRequests.filter((id: mongoose.Types.ObjectId) => !id.equals(fromOId)) as typeof user.friendRequests;

  if (action === 'accept') {
    if (!user.friends.some((id: mongoose.Types.ObjectId) => id.equals(fromOId))) {
      user.friends.push(fromOId);
    }
    await user.save();

    // Add reciprocal friendship
    const requester = await UserModel.findById(fromOId);
    if (requester && !requester.friends.some((id: mongoose.Types.ObjectId) => id.equals(user._id))) {
      requester.friends.push(user._id);
      await requester.save();
    }
    return NextResponse.json({ message: 'Friend added!' });
  }

  await user.save();
  return NextResponse.json({ message: 'Request declined' });
}
