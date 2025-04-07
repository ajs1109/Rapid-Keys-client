import dotenv from 'dotenv';
dotenv.config();

export const MONGO_URI = process.env.MONGO_URI ||"mongodb+srv://ajiteshsr615:OIMhqwBaL0mwRWQS@cluster0.ubltt.mongodb.net/RapidKeys?retryWrites=true&w=majority&appName=Cluster0";
export const JWT_SECRET = process.env.JWT_SECRET || 'XES';
export const TOKEN_SECRET = process.env.TOKEN_SECRET || 'your-secret-key';
export const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret';
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const HOST_NAME = process.env.HOST_NAME || 'localhost';
export const PORT = process.env.PORT || '3000';
export const SERVER_URI = process.env.SERVER_URI || 'https://next-websocket-app-1042819106730.europe-north2.run.app';