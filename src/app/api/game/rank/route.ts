import { dbConfig } from "@/dbConfig/dbConfig";
import { getUserFromToken } from "@/utils/auth";
import UserModel from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";

dbConfig.connect();

// GET /api/game/rank — returns current user's global rank and total player count
export async function GET(req: NextRequest) {
  const token = req.cookies?.get("access_token")?.value;
  const { message, user, status } = await getUserFromToken(token ?? '');
  if (!user) return NextResponse.json({ message }, { status });

  // Rank = number of users with a higher WPM*accuracy score + 1
  const userScore = user.highestWPM * user.highestAccuracy;

  const [rank, total] = await Promise.all([
    UserModel.countDocuments({
      $expr: {
        $gt: [{ $multiply: ['$highestWPM', '$highestAccuracy'] }, userScore]
      }
    }),
    UserModel.countDocuments({}),
  ]);

  return NextResponse.json({ rank: rank + 1, total });
}
