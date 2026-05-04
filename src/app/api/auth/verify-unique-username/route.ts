import { dbConfig } from "@/dbConfig/dbConfig";
import UserModel from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";

dbConfig.connect();
export async function POST(req: NextRequest) {
    const reqBody = await req.json();
    const { username } = reqBody;

    if (!username) {
        return NextResponse.json({ message: "Username does not exist", available: false }, { status: 200 });
    }

    try {
        const user = await UserModel.findOne({ username });
        if (user) {
            return NextResponse.json({ message: "Username is already taken", available: false }, { status: 200 });
        }

        return NextResponse.json({ message: "Username is available", available: true }, { status: 200 });
    } catch {
        return NextResponse.json({ message: "Internal Server Error", available: false }, { status: 500 });
    }
}