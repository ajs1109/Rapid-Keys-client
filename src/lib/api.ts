import useStore from '@/store/useGameStore';
import { AuthResponse, User } from '@/types/auth';
import { apiService } from '@/utils/apiService';

const {setAuth} = useStore.getState();

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const data = await apiService.post<AuthResponse>('/auth/login', { email, password });
    console.log('login response:', data);
    setAuth(data.user, data.accessToken);
    return data;
  } catch (error) {
    throw error;
  }
};

export const signUp = async (username: string, email: string, password: string): Promise<AuthResponse> => {
  try {
    const data = await apiService.post<AuthResponse>('/auth/signup', { username, email, password });
    setAuth(data.user, data.token);
    return data;
  } catch (error) {
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await apiService.post('/auth/logout', {});
    useStore.getState().logout();
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