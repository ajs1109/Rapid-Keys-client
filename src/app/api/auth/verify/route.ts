import { connect } from "@/dbConfig/dbConfig";
import UserModel from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from "@/config";

connect();

const verifyToken = (token: string, secret: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (error, decoded) => {
      if (error) {
        return reject(error);
      }
      resolve(decoded);
    });
  });
};

export async function POST(req: NextRequest) {
  //console.log('into verify post');
  const reqBody = await req.json();
  const token = reqBody?.token;

  if (!token) {
    return NextResponse.json({ message: "Token does not exist" }, { status: 403 });
  }

  try {
    const decoded = await verifyToken(token, JWT_SECRET);

    const user = await UserModel.findById(decoded?.id);
    if (user) { 
      //console.log('from verify:', user);
      return NextResponse.json({ user:{id: user._id as string, username: user.username, email: user.email, highestWPM: user.highestWPM, highestAccuracy: user.highestAccuracy, gamesPlayed: user.gamesPlayed } });
    }

    return NextResponse.json({ message: "User not found" }, { status: 404 });
  } catch (error:any) {
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({ message: "Token expired" }, { status: 401 });
    }
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ message: "Invalid Token" + error }, { status: 401 });
    }
    return NextResponse.json({ message: "Internal Server Error: " + error }, { status: 500 });
  }
}