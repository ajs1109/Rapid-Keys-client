import { JWT_SECRET } from '@/config';
import { db } from '@/db';
import { users, User as DbUser } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { errors, JWTPayload, jwtVerify } from 'jose';

export const verifyToken = async (token: string, secret: string): Promise<JWTPayload> => {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
  return payload;
};

export const getUserFromToken = async (token: string): Promise<{message: string, user: DbUser | null, status: number}> => {
  try{
    const decoded = await verifyToken(token, JWT_SECRET);
    const decodedId = typeof decoded.id === 'string' ? decoded.id : undefined;
    if (!decodedId) {
      return { message: "Invalid Token", user: null, status: 401 };
    }
    const [user] = await db.select().from(users).where(eq(users.id, decodedId));
    if (user) {
      return {message: "User found", user, status: 200}; 
    }
    
    return { message: "User not found", user: null, status: 404 };
  } catch (error: unknown) {
    if (error instanceof errors.JWTExpired) {
      return { message: "Token expired", user: null, status:401 };
    }
    if (error instanceof errors.JOSEError) {
      console.log("Error caught in getUserFromToken():", error);
      return { message: "Invalid Token", user: null, status: 401 };
    }
    console.log("error caught in getUserFromToken():", error);
    return { message: "Internal Server Error: ", user: null, status: 500 };
  }
}
