import { connect } from "@/dbConfig/dbConfig";
import UserModel from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
connect();

export async function PUT(req: NextRequest) {
    const reqBody = await req.json();
    const { username, email, password, newPassword } = reqBody;

    try {
        const user = await UserModel.findOne({ username });
        if (user) {
            return NextResponse.json({ message: "Username is already taken", available: false }, { status: 200 });
        }

        return NextResponse.json({ message: "Username is available", available: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error", available: false }, { status: 500 });
    }
}