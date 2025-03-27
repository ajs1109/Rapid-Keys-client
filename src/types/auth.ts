export interface User {
    id: string;
    username: string;
    email: string;
    gamesPlayed: number;
    highestWPM: number;
    highestAccuracy: number;
  }
  
  export interface AuthResponse {
    user: User;
    token: string;
    accessToken: string;
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