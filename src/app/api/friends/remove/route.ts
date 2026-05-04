import { dbConfig } from "@/dbConfig/dbConfig";
import { getUserFromToken } from "@/utils/auth";
import UserModel from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

dbConfig.connect();

// POST /api/friends/remove  { friendId }
export async function POST(req: NextRequest) {
  const token = req.cookies?.get("access_token")?.value;
  const { message, user, status } = await getUserFromToken(token ?? '');
  if (!user) return NextResponse.json({ message }, { status });

  const body = await req.json();
  const friendId: string = body.friendId;
  if (!friendId) return NextResponse.json({ message: 'friendId required' }, { status: 400 });

  let friendOId: mongoose.Types.ObjectId;
  try {
    friendOId = new mongoose.Types.ObjectId(friendId);
  } catch {
    return NextResponse.json({ message: 'Invalid friendId' }, { status: 400 });
  }

  // Remove bidirectionally using $pull — atomic, no stale-schema issues
  await UserModel.findByIdAndUpdate(user._id, { $pull: { friends: friendOId } });
  await UserModel.findByIdAndUpdate(friendOId, { $pull: { friends: user._id } });

  return NextResponse.json({ message: 'Friend removed' });
}
