import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/utils/auth";

export async function DELETE(req: NextRequest) {
  const token = req.cookies?.get("access_token")?.value;
  try{
    const {user} = await getUserFromToken(token ?? '');
  if (!user) {
    return NextResponse.json({ message: "User not found", success: false }, { status: 404 });
  }
  await db.update(users)
    .set({
      highestAccuracy: 0,
      highestWpm: 0,
      gamesPlayed: 0,
    })
    .where(eq(users.id, user.id));
  return NextResponse.json({ message: "User updated", success: true }, { status: 200 });
  }
  catch(error: unknown){
    console.log("Error in delete-scores:", error);
    return NextResponse.json({ message: "Internal Server Error", success: false }, { status: 500 });
  }
}