import { SignJWT } from "jose";
import { NODE_ENV, REFRESH_SECRET, TOKEN_SECRET } from "@/config";
import { User } from "@/types/auth";
import { NextResponse } from "next/server";

// Cookie options
export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

export const ACCESS_COOKIE_OPTIONS = {
  secure: NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: "/",
};

export const generateAccessToken = async (user: User, res: NextResponse) => {
  const accessToken = await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(new TextEncoder().encode(TOKEN_SECRET));
  res.cookies.set("access_token", accessToken);
  return accessToken;
};

export const generateRefreshToken = async (user: User, res: NextResponse) => {
  const refreshToken = await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(REFRESH_SECRET));

  res.cookies.set("refresh_token", refreshToken);
  return refreshToken;
};

export const clearCookies = (res: NextResponse) => {
  res.cookies.delete("refresh_token");
  res.cookies.delete("access_token");
};
