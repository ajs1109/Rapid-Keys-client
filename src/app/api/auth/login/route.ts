import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/config';

export async function POST(request: NextRequest) {
    try{
        const reqBody = await request.json();
        const {email, password} = reqBody;

        let [user] = await db.select().from(users).where(eq(users.email, email));
        if(!user){
            [user] = await db.select().from(users).where(eq(users.username, email));
            if(!user){
                return NextResponse.json({message: "User not found"}, {status: 400});
            }
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if(!validPassword){
            return NextResponse.json({message: "Invalid credentials"}, {status: 401});
        }

        const response = NextResponse.json({
            message: "Login successful",
            success: true
        });

        const token = await jwt.sign({id: user.id}, JWT_SECRET, {expiresIn: "2days"});

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
        console.error('error from login:', error);
        return NextResponse.json({message: "Internal server error"}, {status: 500});
    }
}