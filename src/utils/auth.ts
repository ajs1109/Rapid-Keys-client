import { JWT_SECRET } from '@/config';
import { db } from '@/db';
import { users, User as DbUser } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt, { JwtPayload } from 'jsonwebtoken';

export const verifyToken = (token: string, secret: string): Promise<string | JwtPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (error, decoded) => {
      if (error) {
        return reject(error);
      }
      resolve(decoded as string | JwtPayload);
    });
  });
};

export const getUserFromToken = async (token: string): Promise<{message: string, user: DbUser | null, status: number}> => {
  try{
    const decoded = await verifyToken(token, JWT_SECRET);
    const decodedId = typeof decoded === 'string' ? undefined : decoded.id;
    if (!decodedId) {
      return { message: "Invalid Token", user: null, status: 401 };
    }
    const [user] = await db.select().from(users).where(eq(users.id, decodedId));
    if (user) {
      return {message: "User found", user, status: 200}; 
    }
    
    return { message: "User not found", user: null, status: 404 };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      return { message: "Token expired", user: null, status:401 };
    }
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      console.log("Error caught in getUserFromToken():", error);
      return { message: "Invalid Token", user: null, status: 401 };
    }
    console.log("error caught in getUserFromToken():", error);
    return { message: "Internal Server Error: ", user: null, status: 500 };
  }
}