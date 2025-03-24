import { useAuthStore } from '@/store/useGameStore';
import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';

export class ApiService {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string = process.env.SERVER_URI || 'http://localhost:2000') {
    //baseURL = `${baseURL}/api`;
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
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    console.log(url, config, this.axiosInstance);
    const response: AxiosResponse<T> = await this.axiosInstance.get(url, config);
    return response.data;
  }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post(url, data, config);
    return response.data;
  }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.put(url, data, config);
    return response.data;
  }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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