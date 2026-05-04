import { dbConfig } from "@/dbConfig/dbConfig";
import { getUserFromToken } from "@/utils/auth";
import UserModel from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

dbConfig.connect();

// GET /api/friends — returns { friends, requests } both as { id, username }[]
export async function GET(req: NextRequest) {
  const token = req.cookies?.get("access_token")?.value;
  const { message, user, status } = await getUserFromToken(token ?? '');
  if (!user) return NextResponse.json({ message }, { status });

  const populated = await UserModel.findById(user._id)
    .populate('friends', 'username')
    .populate('friendRequests', 'username')
    .lean() as {
      friends: Array<{ _id: unknown; username: string }>;
      friendRequests: Array<{ _id: unknown; username: string }>;
    } | null;

  const friends = (populated?.friends ?? []).map(f => ({ id: String(f._id), username: f.username }));
  const requests = (populated?.friendRequests ?? []).map(r => ({ id: String(r._id), username: r.username }));

  return NextResponse.json({ friends, requests });
}

// POST /api/friends — send a friend request { targetUsername }
export async function POST(req: NextRequest) {
  const token = req.cookies?.get("access_token")?.value;
  const { message, user, status } = await getUserFromToken(token ?? '');
  if (!user) return NextResponse.json({ message }, { status });

  const body = await req.json();
  const targetUsername: string = body.targetUsername;
  if (!targetUsername?.trim()) return NextResponse.json({ message: 'Username required' }, { status: 400 });
  if (targetUsername === user.username) return NextResponse.json({ message: "You can't add yourself" }, { status: 400 });

  const target = await UserModel.findOne({ username: targetUsername });
  if (!target) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  if (target.friends.some((id: mongoose.Types.ObjectId) => id.equals(user._id)))
    return NextResponse.json({ message: 'Already friends!' }, { status: 400 });

  if (target.friendRequests.some((id: mongoose.Types.ObjectId) => id.equals(user._id)))
    return NextResponse.json({ message: 'Request already sent' }, { status: 400 });

  // Also check if target already sent us a request — auto-accept
  if (user.friendRequests.some((id: mongoose.Types.ObjectId) => id.equals(target._id))) {
    user.friendRequests = user.friendRequests.filter((id: mongoose.Types.ObjectId) => !id.equals(target._id)) as typeof user.friendRequests;
    user.friends.push(target._id);
    target.friends.push(user._id);
    await user.save();
    await target.save();
    return NextResponse.json({ message: 'You are now friends!' });
  }

  target.friendRequests.push(user._id);
  await target.save();
  return NextResponse.json({ message: 'Friend request sent!', targetId: target._id.toString() });
}
