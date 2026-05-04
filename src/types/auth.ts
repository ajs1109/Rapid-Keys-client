export interface User {
  id: string;
  username: string;
  email: string;
  gamesPlayed: number;
  highestWPM: number;
  highestAccuracy: number;
}

export interface FriendUser {
  id: string;
  username: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  accessToken: string;
}
