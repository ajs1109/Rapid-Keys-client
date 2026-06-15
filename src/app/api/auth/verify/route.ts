import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/utils/auth";

export async function POST(req: NextRequest) {
  const reqBody = await req.json();
  const token = reqBody?.token;

  if (!token) {
    return NextResponse.json({ message: "Token does not exist" }, { status: 403 });
  }

  const { message, user, status } = await getUserFromToken(token ?? "");
  if (!user) {
    return NextResponse.json({ message, success: false }, { status });
  }
  return NextResponse.json({ user:{id: user.id, username: user.username, email: user.email, highestWPM: user.highestWpm, highestAccuracy: user.highestAccuracy, gamesPlayed: user.gamesPlayed } });
}