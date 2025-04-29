import { dbConfig } from "@/dbConfig/dbConfig";
import UserModel from "@/models/userModel";
import { getUserFromToken } from "@/utils/auth";
import { NextRequest, NextResponse } from "next/server";

dbConfig.connect();
export async function PUT(req: NextRequest) {
    const token = req.cookies.get("access_token")?.value;
    console.log('cookeies:', req.cookies.get("access_token"));
    const reqBody = await req.json();
    const { username, email, password, newPassword } = reqBody;
    const user = await getUserFromToken('a');
}