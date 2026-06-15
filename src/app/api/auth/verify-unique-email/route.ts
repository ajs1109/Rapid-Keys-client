import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const reqBody = await req.json();
    const { email } = reqBody;
    if (!email) {
        return NextResponse.json({ message: "Email does not exist", available: false }, { status: 200 });
    }

    try {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (user) {
            return NextResponse.json({ message: "Email is already registered", available: false }, { status: 200 });
        }

        return NextResponse.json({ message: "Email is available", available: true }, { status: 200 });
    } catch {
        return NextResponse.json({ message: "Internal Server Error", available: false }, { status: 500 });
    }
}