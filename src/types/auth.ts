export interface User {
    id: string;
    username: string;
    email: string;
  }
  
  export interface AuthResponse {
    user: User;
    token: string;
  }

  export interface DecodedToken {
    id: string;
    username: string;
    email: string;
    iat?: number;
    exp?: number;
  }

  export interface MongoErrorResponse {
    message: string;
    code?: number;
    field?: string;
  }