import { dbConfig } from "@/dbConfig/dbConfig";
import UserModel from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import { JWT_SECRET } from "@/config";
import { getUserFromToken, verifyToken } from "@/utils/auth";

dbConfig.connect();
export async function POST(req: NextRequest) {
  console.log('into post verify');
  const reqBody = await req.json();
  const token = reqBody?.token;
  console.log('cookeies:', req.headers);

  if (!token) {
    return NextResponse.json({ message: "Token does not exist" }, { status: 403 });
  }

  const { message, user, status } = await getUserFromToken(token ?? "");
  if (!user) {
    return NextResponse.json({ message, success: false }, { status });
  }
  return NextResponse.json({ user:{id: user._id as string, username: user.username, email: user.email, highestWPM: user.highestWPM, highestAccuracy: user.highestAccuracy, gamesPlayed: user.gamesPlayed } });
}