import { dbConfig } from "@/dbConfig/dbConfig";
import UserModel from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import { User } from "@/types/auth";
import { getUserFromToken } from "@/utils/auth";


dbConfig.connect();
export async function DELETE(req: NextRequest) {
  const token = req.cookies?.get("access_token")?.value;
  try{
    const {user} = await getUserFromToken(token ?? '');
  if (!user) {
    return NextResponse.json({ message: "User not found", success: false }, { status: 404 });
  }
  user.highestAccuracy = 0;
  user.highestWPM = 0;
  user.gamesPlayed = 0;
  await user.save();
  return NextResponse.json({ message: "User updated", success: true }, { status: 200 });
  }
  catch(error:any){
    console.log("Error in delete-scores:", error);
    return NextResponse.json({ message: "Internal Server Error", success: false }, { status: 500 });
  }

}