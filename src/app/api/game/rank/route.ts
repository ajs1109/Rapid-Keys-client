import { db } from "@/db";
import { users } from "@/db/schema";
import { count, sql } from "drizzle-orm";
import { getUserFromToken } from "@/utils/auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/game/rank — returns current user's global rank and total player count
export async function GET(req: NextRequest) {
  const token = req.cookies?.get("access_token")?.value;
  const { message, user, status } = await getUserFromToken(token ?? '');
  if (!user) return NextResponse.json({ message }, { status });

  // Rank = number of users with a higher WPM*accuracy score + 1
  const userScore = user.highestWpm * user.highestAccuracy;

  const [rankResult] = await db
    .select({ value: count() })
    .from(users)
    .where(sql`${users.highestWpm} * ${users.highestAccuracy} > ${userScore}`);
  
  const [totalResult] = await db
    .select({ value: count() })
    .from(users);

  const rank = Number(rankResult?.value ?? 0);
  const total = Number(totalResult?.value ?? 0);

  return NextResponse.json({ rank: rank + 1, total });
}
