import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from "@/config";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
    try{
        const reqBody = await request.json();
        const {username, email, password} = reqBody;

        const [existingEmail] = await db.select().from(users).where(eq(users.email, email));
        if(existingEmail){
            return NextResponse.json({message: "Email already exists"}, {status: 400});
        }

        const [existingUsername] = await db.select().from(users).where(eq(users.username, username));
        if(existingUsername){
            return NextResponse.json({message: "Username already exists"}, {status: 400});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [newUser] = await db.insert(users).values({
            username,
            email,
            password: hashedPassword,
        }).returning();

        const response = NextResponse.json({
                    message: "Signup successful",
                    success: true
                });
        
        const token = await jwt.sign({id: newUser.id}, JWT_SECRET, {expiresIn: "2days"});
        
        response.cookies.set("access_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 2 * 24 * 60 * 60, // 2 days in seconds — must match JWT expiresIn
            path: "/",
        });
        return response;
    }
    catch(error){
        console.error('error from signup:', error);
        return NextResponse.json({message: "Internal server error"}, {status: 500});
    }
}