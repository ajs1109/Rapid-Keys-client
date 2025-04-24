import { connect } from "@/dbConfig/dbConfig";
import UserModel from "@/models/userModel";
import { getUserFromToken } from "@/utils/auth";
import { NextRequest, NextResponse } from "next/server";
connect();

export async function PUT(req: NextRequest) {
    const reqBody = await req.json();
    const { username, email, password, newPassword } = reqBody;
    const user = await getUserFromToken('a');
}