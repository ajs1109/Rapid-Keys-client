import { JWT_SECRET } from '@/config';
import UserModel, { IUser } from '@/models/userModel';
import jwt from 'jsonwebtoken';

export const verifyToken = (token: string, secret: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (error, decoded) => {
      if (error) {
        return reject(error);
      }
      resolve(decoded);
    });
  });
};

export const getUserFromToken = async (token: string): Promise<{message: string, user: IUser | null, status: number}> => {
  try{
    const decoded = await verifyToken(token, JWT_SECRET);
    
        const user = await UserModel.findById(decoded?.id);
        if (user) {
          return {message: "User found", user, status: 200}; 
        }
    
        return { message: "User not found", user: null, status: 404 };
      } catch (error:any) {
        if (error.name === 'TokenExpiredError') {
          return { message: "Token expired", user: null, status:401 };
        }
        if (error.name === 'JsonWebTokenError') {
          console.log("Error caught in getUserFromToken():", error);
          return { message: "Invalid Token", user: null, status: 401 };
        }
        console.log("error caught in getUserFromToken():", error);
        return { message: "Internal Server Error: ", user: null, status: 500 };
      }
}