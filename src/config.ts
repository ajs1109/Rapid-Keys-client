import dotenv from 'dotenv';
dotenv.config();
export const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/typing_game';
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
export const TOKEN_SECRET = process.env.TOKEN_SECRET || 'your-secret-key';
export const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret';
export const NODE_ENV = process.env.NODE_ENV || 'development';
