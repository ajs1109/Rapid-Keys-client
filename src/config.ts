export const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://ajiteshsr615:<your-pass>@cluster0.ubltt.mongodb.net/RapidKeys?retryWrites=true&w=majority&appName=Cluster0";
export const JWT_SECRET = process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET env var is not set'); })();
export const TOKEN_SECRET = process.env.TOKEN_SECRET || 'your-secret-key';
export const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret';
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const HOST_NAME = process.env.HOST_NAME || 'localhost';
export const PORT = process.env.PORT || '3000';

export const SERVER_URI = process.env.NODE_ENV === 'production'
  ? (process.env.NEXT_PUBLIC_SERVER_URI || 'https://rapidkeys-1042819106730.us-central1.run.app')
  : 'http://localhost:3000';
