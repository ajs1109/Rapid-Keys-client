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