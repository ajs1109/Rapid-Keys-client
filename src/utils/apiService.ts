import { SERVER_URI } from '@/config';
import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { getAccessToken } from './clientUtils';
import Cookies from 'js-cookie';

export class ApiService {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string = SERVER_URI) {
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
    //const token1 = window.document.cookie.split('=')[1];
    this.axiosInstance.interceptors.request.use(
      (config) => {
        //const token = getAccessToken();
       
        // const token = Cookies.get('access_token');
        // console.log('token from cookies:', token);
        // if (token) {
        //   config.headers['Authorization'] = `Bearer ${token}`;
        // }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const errorMessage = error.response?.data?.message || 'An unexpected error occurred...';
        return Promise.reject(new Error(errorMessage));
      }
    );
  }

 public setupHeader(header: string, value: string) {
    if(this.axiosInstance){
      this.axiosInstance.defaults.headers[header] = value;
    } else  {
      console.error('Axios instance is not initialized');
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
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