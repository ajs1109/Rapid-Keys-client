import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "./lib/api";
import { publicRoutes } from "./routes";
import { apiService } from "./utils/apiService";

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  let isAuthenticated = false;
  if (accessToken) {
    apiService.setupHeader("Authorization", `Bearer ${accessToken}`);
    try {
      const { user } = await verifyUser(accessToken);
      isAuthenticated = Boolean(user);
    } catch {
      isAuthenticated = false;
    }
  }

  const path = request.nextUrl.pathname;
  const isAuthPath = publicRoutes.includes(path);
  let nextResponse;
  if (!isAuthenticated && !isAuthPath) {
    nextResponse = NextResponse.redirect(new URL("/auth", request.url));
  } else if (isAuthenticated && isAuthPath) {
    nextResponse = NextResponse.redirect(new URL("/menu", request.url));
  } else {
    nextResponse = NextResponse.next();
  }

  return nextResponse;
}

export const config = {
  matcher: ["/auth", "/menu", "/single-player", "/multi-player", "/"],
};
