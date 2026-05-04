import { dbConfig } from "@/dbConfig/dbConfig";
import { getUserFromToken } from "@/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

dbConfig.connect();
export async function PUT(req: NextRequest) {
    const token = req.cookies?.get("access_token")?.value;
    //console.log('cookeies:', req.cookies.get("access_token"));
    const reqBody = await req.json();
    const { username, email, password, newPassword } = reqBody;
    const { message ,user, status} = await getUserFromToken(token ?? '');
    if (!user) {
        return NextResponse.json({ message, success: false }, { status });
    }
    try {
        if (username) {
            user.username = username;
        }
        if (email) {
            user.email = email;
        }
        if (password && newPassword) {
            const validPassword = await bcrypt.compare(password, user.password);
            if(!validPassword){
                return NextResponse.json({message: "Incorrect Password"}, {status: 401});
            }
            user.password = newPassword;
        }
        await user.save();
        return NextResponse.json({
            message: "User updated",
            success: true,
            user: {
                id: String(user._id),
                username: user.username,
                email: user.email,
                gamesPlayed: user.gamesPlayed,
                highestWPM: user.highestWPM,
                highestAccuracy: user.highestAccuracy,
            },
        }, { status: 200 });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ message: "Internal Server Error: " + errorMessage, success: false }, { status: 500 });
    }
}