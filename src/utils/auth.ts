import * as jose from 'jose';
import { AuthResponse, DecodedToken, MongoErrorResponse, User } from '../types/auth';
import Cookies from 'js-cookie';

export const AUTH_COOKIE = 'auth_token';

export const authUtils = {
  setAuthCookie: (token: string) => {
    document.cookie = `${AUTH_COOKIE}=${token}; path=/; max-age=2592000; SameSite=Strict`;
  },

  removeAuthCookie: () => {
    document.cookie = `${AUTH_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
  },

  handleAuthResponse: async (response: Response): Promise<AuthResponse> => {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Authentication failed');
    }
    return response.json();
  }
};

export const decodeToken = async (token: string): Promise<User | null> => {
  try {
    const secret = process.env.JWT_SECRET || "XES";
    console.log('jwtsecret:',secret);
    if (!secret) {
      console.error('JWT_SECRET is not defined');
      return null;
    }

    const secretBytes = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, secretBytes) as any;
    console.log('payload:',payload);
    // Extract only the fields we want and type them correctly
    const decodedToken: User = {
      id: payload.user._id as string,
      username: payload.user.username as string,
      email: payload.user.email as string
    };

    // console.log('decoded token:', decodedToken);
    return decodedToken;
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
};

export function getCookie(name: string): string | undefined {
  console.log('cookie:', Cookies.get(name));
  return Cookies.get(name);
}
