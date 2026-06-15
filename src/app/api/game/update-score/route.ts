import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  
  const reqBody = await req.json();
  const { userId, wpm, accuracy, gamesPlayed} = reqBody;
  if (!(userId && wpm != null && accuracy != null && gamesPlayed != null)) {
    return NextResponse.json({ message: "Insufficient Data" }, { status: 403 });
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user) {
      const updateData: Partial<typeof users.$inferInsert> = { gamesPlayed };
      
      const currentScore = user.highestWpm * user.highestAccuracy;
      const newScore = wpm * accuracy;
      if (newScore > currentScore || (newScore === currentScore && wpm > user.highestWpm)) {
        updateData.highestWpm = wpm;
        updateData.highestAccuracy = accuracy;
      }
      
      await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId));
      
      return NextResponse.json({ message: "Done", success: true }, { status: 200 });
    }

    return NextResponse.json({ message: "User not found", success: false }, { status: 404 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: "Internal Server Error: " + errorMessage, success: false }, { status: 500 });
  }
}