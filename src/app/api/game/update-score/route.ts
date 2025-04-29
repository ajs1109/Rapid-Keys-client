import { dbConfig } from "@/dbConfig/dbConfig";
import UserModel from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import { User } from "@/types/auth";


dbConfig.connect();
export async function POST(req: NextRequest) {
  
  const reqBody = await req.json();
  const { userId, wpm, accuracy, gamesPlayed} = reqBody;
  console.log('into update-score post', reqBody);
//   if (!(userId && wpm && accuracy && gamesPlayed)) {
//     return NextResponse.json({ message: "Insufficient Data " }, { status: 403 });
//   }

  try {
    const user = await UserModel.findById(userId);
    if (user) { 
        console.log('user found');
      user.gamesPlayed = gamesPlayed;
      if(user.highestWPM * user.highestAccuracy < wpm * accuracy || (user.highestWPM * user.highestAccuracy === wpm * accuracy && wpm > user.highestWPM)){
        user.highestWPM = wpm;
        user.highestAccuracy = accuracy;
      }
      console.log('new user:' , user);
      await user.save();
      
      return NextResponse.json({ message: "Done", success: true }, { status: 200 });
    }

    return NextResponse.json({ message: "User not found", success: false }, { status: 404 });
  } catch (error:any) {
    return NextResponse.json({ message: "Internal Server Error: " + error, success: false }, { status: 500 });
  }
}