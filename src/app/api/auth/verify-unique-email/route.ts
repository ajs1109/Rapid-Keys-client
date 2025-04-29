import { dbConfig } from "@/dbConfig/dbConfig";
import UserModel from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";

dbConfig.connect();
export async function POST(req: NextRequest) {
    const reqBody = await req.json();
    const { email } = reqBody;
    console.log('cookeies from email:', req.headers);
    if (!email) {
        return NextResponse.json({ message: "Email does not exist", available: false }, { status: 200 });
    }

    try {
        const user = await UserModel.findOne({ email });
        if (user) {
            return NextResponse.json({ message: "Email is aleady registered", available: false }, { status: 200 });
        }

        return NextResponse.json({ message: "Email is available", available: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error", available: false }, { status: 500 });
    }
}