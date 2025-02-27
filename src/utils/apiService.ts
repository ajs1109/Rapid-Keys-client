import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

export class ApiService {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string = process.env.SERVER_URI || 'http://localhost:5000') {
    baseURL = `${baseURL}/api`;
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = Cookies.get('access_token');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const refreshToken = Cookies.get('refresh_token');
          if (refreshToken) {
            try {
              const response = await this.post<{ accessToken: string }>('/auth/refresh', { token: refreshToken });
              Cookies.set('access_token', response.accessToken);
              originalRequest.headers['Authorization'] = `Bearer ${response.accessToken}`;
              return this.axiosInstance(originalRequest);
            } catch (refreshError) {
              console.error('Refresh token expired or invalid:', refreshError);
              Cookies.remove('access_token');
              Cookies.remove('refresh_token');
              window.location.href = '/auth';
            }
          }
        }
        const errorMessage = error.response?.data?.message || 'An unexpected error occurred';
        return Promise.reject(new Error(errorMessage));
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.delete(url, config);
    return response.data;
  }
}

export const apiService = new ApiService();