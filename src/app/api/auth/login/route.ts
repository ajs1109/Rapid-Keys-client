import { connect } from "@/dbConfig/dbConfig";
import UserModel from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/config';


connect();

export async function POST(request: NextRequest) {
    try{
        const reqBody = await request.json();
        const {email, password} = reqBody;

        console.log('reqBody from login:', reqBody);

        let user = await UserModel.findOne({email});
        if(!user){
            user = await UserModel.findOne({username: email});
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

        const token = await jwt.sign({id: user._id}, JWT_SECRET, {expiresIn: "2days"});

        response.cookies.set("access_token", token);
        
        return response;
    }
    catch(error){
        console.error('error from login:', error);
        return NextResponse.json({message: "Internal server error"}, {status: 500});
    }
}