import { connect } from "@/dbConfig/dbConfig";
import UserModel from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import { User } from "@/types/auth";
import { JWT_SECRET } from "@/config";
const { TOKEN_SECRET, REFRESH_SECRET, NODE_ENV } = require('../config');

// Cookie options
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/'
};

const ACCESS_COOKIE_OPTIONS = {
  secure: NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/'
};

const generateAccessToken = (user: User, res: NextResponse) => {
  const accessToken = jwt.sign(
    { user: user },
    TOKEN_SECRET,
    { expiresIn: '15m' }
  );
  res.cookies.set('access_token', accessToken);
  return accessToken;
}

const generateRefreshToken = (user: User, res: NextResponse) => { 
  const refreshToken = jwt.sign(
    { user: user },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  res.cookies.set('refresh_token', refreshToken);
  return refreshToken;
}

const clearCookies = (res: NextResponse) => {
  res.cookies.delete('refresh_token');
  res.cookies.delete('access_token');
}

connect();

export async function POST(request: NextRequest) {
    try{
        const reqBody = await request.json();
        const {username, email, password} = reqBody;

        console.log('reqBody from signup:', reqBody);

        let user = await UserModel.findOne({email: email});
        if(user){
            return NextResponse.json({message: "Email already exists"}, {status: 400});
        }

        user = await UserModel.findOne({username: username});
        if(user){
            return NextResponse.json({message: "Username already exists"}, {status: 400});
        }

        const newUser = new UserModel({
            username,
            email,
            password
        });

        const savedUser = await newUser.save();

        const response = NextResponse.json({
                    message: "Signup successful",
                    success: true
                });
        
        const token = await jwt.sign({id: newUser._id}, JWT_SECRET, {expiresIn: "2days"});
        
        response.cookies.set("access_token", token);
        return response;
    }
    catch(error){
        console.error('error from login:', error);
        return NextResponse.json({message: "Internal server error"}, {status: 500});
    }
}