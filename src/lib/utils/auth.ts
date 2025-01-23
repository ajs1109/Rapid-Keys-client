import jwt from 'jsonwebtoken';
import * as jose from 'jose';
import { Error as MongoError } from 'mongoose';
import { AuthResponse, DecodedToken, MongoErrorResponse } from '../types/auth';
import Cookies from 'js-cookie';
export const AUTH_COOKIE = 'auth_token';

export const authUtils = {
  setAuthCookie: (token: string) => {
    document.cookie = `${AUTH_COOKIE}=${token}; path=/; max-age=2592000; SameSite=Strict`;
  },

  removeAuthCookie: () => {
    document.cookie = `${AUTH_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
  },

  handleAuthResponse: async (response: any): Promise<AuthResponse> => {
    try {
      
      console.log('response is not OK', response);
      // Check if the response is OK
      if (response.ok) {
        return response;
      }
      throw new Error(response.error || 'Authentication failed');
    } catch (parseError: any) {
      // Fallback in case response body cannot be parsed
      console.error('Failed to parse response:', parseError);
      throw new Error('An error occurred while processing the response.');
    }
  },
};

export const decodeToken = async (token: string): Promise<DecodedToken | null> => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not defined');
      return null;
    }

    const secretBytes = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, secretBytes);

    const decodedToken: DecodedToken = {
      id: payload.id as string,
      username: payload.username as string,
      email: payload.email as string,
      iat: payload.iat as number,
      exp: payload.exp as number
    };

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

export const generateToken = (payload: DecodedToken): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign(payload, secret, {
    expiresIn: '7d', // Match cookie expiry
  });
};

export const handleMongoError = (error: unknown): MongoErrorResponse => {
  if (error instanceof MongoError.ValidationError) {
    const field = Object.keys(error.errors)[0];
    return {
      message: error.errors[field].message,
      field,
      code: 400
    };
  }

  if ((error as any).code === 11000) {
    const field = Object.keys((error as any).keyPattern)[0];
    return {
      message: `${field} already exists`,
      field,
      code: 409
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 500
    };
  }

  return {
    message: 'An unexpected error occurred',
    code: 500
  };
};