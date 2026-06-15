import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserFromToken } from "@/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest) {
    const token = req.cookies?.get("access_token")?.value;
    const reqBody = await req.json();
    const { username, email, password, newPassword } = reqBody;
    const { message ,user, status} = await getUserFromToken(token ?? '');
    if (!user) {
        return NextResponse.json({ message, success: false }, { status });
    }
    try {
        const updateData: Partial<typeof users.$inferInsert> = {};
        if (username) {
            updateData.username = username;
        }
        if (email) {
            updateData.email = email;
        }
        if (password && newPassword) {
            const validPassword = await bcrypt.compare(password, user.password);
            if(!validPassword){
                return NextResponse.json({message: "Incorrect Password"}, {status: 401});
            }
            updateData.password = await bcrypt.hash(newPassword, 10);
        }
        
        let updatedUser = user;
        if (Object.keys(updateData).length > 0) {
            const [result] = await db
                .update(users)
                .set(updateData)
                .where(eq(users.id, user.id))
                .returning();
            if (result) {
                updatedUser = result;
            }
        }
        
        return NextResponse.json({
            message: "User updated",
            success: true,
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                gamesPlayed: updatedUser.gamesPlayed,
                highestWPM: updatedUser.highestWpm,
                highestAccuracy: updatedUser.highestAccuracy,
            },
        }, { status: 200 });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ message: "Internal Server Error: " + errorMessage, success: false }, { status: 500 });
    }
}