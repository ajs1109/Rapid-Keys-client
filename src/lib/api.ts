import { AuthResponse, FriendUser, User } from '@/types/auth';
import { EditUser } from '@/types/edit';
import { apiService } from '@/utils/apiService';

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const data = await apiService.post<AuthResponse>('/auth/login', { email, password });
    return data;
  } catch (error) {
    throw error;
  }
};

export const signUp = async (username: string, email: string, password: string): Promise<AuthResponse> => {
  try {
    const data = await apiService.post<AuthResponse>('/auth/signup', { username, email, password });
    return data;
  } catch (error) {
    throw error;
  }
};

export const verifyUser = async (token: string): Promise<{message:string, user?:User}> => {
  try {
    const data = await apiService.post<{message:string, user?:User}>('/auth/verify', {token});
    return data;
  } catch (error) {
    throw error;
  }
};

export const refreshAuthToken = async (token: string): Promise<{message: string, user?: User}> => {
  try{
    const data = await apiService.post<{message: string, user?: User}>('/auth/refresh', {token});
    return data;
  } catch (error) {
    throw error;
  }
}

export const refreshAccessToken = async (): Promise<{message: string, user?: User}> => {
  try{
    const data = await apiService.get<{message: string, user?: User}>('/auth/refresh');
    return data;
  } catch (error) {
    throw error;
  } 
}

export const refreshAccToken = async (refreshToken: string): Promise<{ accessToken: string, user: User }> => {
  try {
    const response = await apiService.post<{ accessToken: string, user: User }>('/auth/refresh', { token: refreshToken });
    return response;
  } catch (error) {
    throw error;
  }
};

export const me = async (): Promise<string> => {
  try{
    const data = await apiService.get<{token: string}>('/auth/me');
    return data.token;
  } catch (error) {
    throw error;
  }
}

export const verifyTokenFromServer = async (refreshToken: string): Promise<{message: string, user?: User}> => {
  try {
    const data = await apiService.post<{message: string, user?: User}>('/auth/verify-token', {refreshToken})
    return data;
  } catch (error) {
    throw error;
  }
}

export const loggedInUserData = async(): Promise<{user?: User}> => {
  try{
    const data = await apiService.get<{user?: User}>('/auth/user');
    return data;
  } catch (error) {
    throw error;
  }
}

export const generateWords = async(count: number): Promise<{words: string}> => {
  try{
    const data = await apiService.post<{words: string}>(`/game/generate-words`, {count});
    return data;
  } catch (error) {
    throw error;
  }
}

export const updateScore = async(userId: string, wpm: number, accuracy: number, gamesPlayed: number): Promise<{message: string, success: boolean}> => {
  try{
    const data = await apiService.post<{message: string, success: boolean}>(`/game/update-score`, {userId, wpm, accuracy, gamesPlayed});
    return data;
  } catch (error) {
    throw error;
  }
}

export const updateProfile = async(user: EditUser): Promise<{message: string, user?: User}> => {
  try{
    const data = await apiService.put<{message: string, success: boolean}>(`/edit`, user);
    return data;
  } catch (error) {
    throw error;
  }
}

export const deleteScores = async(): Promise<{message: string, success: boolean}> => {
  try{
    const data = await apiService.delete<{message: string, success: boolean}>(`/game/delete-scores`);
    return data;
  } catch (error) {
    throw error;
  }
}

export const checkUsernameAvailability = async(username: string): Promise<{message: string, available: boolean}> => {
  try{
    const data = await apiService.post<{message: string, available: boolean}>(`/auth/verify-unique-username`, {username});
    return data;
  } catch (error) {
    throw error;
  }
}

export const checkEmailAvailability = async(email: string): Promise<{message: string, available: boolean}> => {
  try{
    const data = await apiService.post<{message: string, available: boolean}>(`/auth/verify-unique-email`, {email});
    return data;
  } catch (error) {
    throw error;
  }
}

// ── Rank ──────────────────────────────────────────────────────────────────────
export const getMyRank = async (): Promise<{ rank: number; total: number }> => {
  const data = await apiService.get<{ rank: number; total: number }>('/game/rank');
  return data;
};

// ── Friends ───────────────────────────────────────────────────────────────────
export const getFriendsAndRequests = async (): Promise<{ friends: FriendUser[]; requests: FriendUser[] }> => {
  const data = await apiService.get<{ friends: FriendUser[]; requests: FriendUser[] }>('/friends');
  return data;
};

export const sendFriendRequest = async (targetUsername: string): Promise<{ message: string; targetId?: string }> => {
  const data = await apiService.post<{ message: string; targetId?: string }>('/friends', { targetUsername });
  return data;
};

export const respondToFriendRequest = async (fromUserId: string, action: 'accept' | 'decline'): Promise<{ message: string }> => {
  const data = await apiService.put<{ message: string }>('/friends/respond', { fromUserId, action });
  return data;
};

export const removeFriend = async (friendId: string): Promise<{ message: string }> => {
  const data = await apiService.post<{ message: string }>('/friends/remove', { friendId });
  return data;
};
