import { dbConfig } from "@/dbConfig/dbConfig";
import UserModel from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken';
import { User } from "@/types/auth";
import { JWT_SECRET } from "@/config";

dbConfig.connect();
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