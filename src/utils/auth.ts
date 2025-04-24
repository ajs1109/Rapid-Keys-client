import { JWT_SECRET } from '@/config';
import UserModel from '@/models/userModel';
import { User } from '@/types/auth';
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

export const getUserFromToken = async (token: string): Promise<User | null> => {
  const decoded = await verifyToken(token, JWT_SECRET);
  const user = await UserModel.findById(decoded?.id);

  if (user) {
    return { id: user._id as string, username: user.username, email: user.email, highestWPM: user.highestWPM, highestAccuracy: user.highestAccuracy, gamesPlayed: user.gamesPlayed };
  }
  return null;
}