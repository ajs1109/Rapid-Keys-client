class ApiService {
    private baseUrl: string;
  
    constructor(baseUrl: string) {
      this.baseUrl = baseUrl;
    }
  
    private async request<T>(
      endpoint: string,
      options: RequestInit = {}
    ): Promise<T> {
      const url = `${this.baseUrl}${endpoint}`;
  
      // Default headers
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
  
      try {
        const response = await fetch(url, {
          ...options,
          headers,
        });
        console.log('response', response);
  
        if (!response.ok) {
          const error = await response.json();
          return error;
        }
        return response.json();
      } catch (error) {
        console.error('API Request Error:', error);
        throw error;
      }
    }
  
    get<T>(endpoint: string, options?: RequestInit): Promise<T> {
        console.log('into get');
      return this.request<T>(endpoint, { ...options, method: 'GET' });
    }
  
    post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
        console.log('into post request');
      return this.request<T>(endpoint, {
        ...options,
        method: 'POST',
        body: JSON.stringify(body),
      });
    }
  
    put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
      return this.request<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(body),
      });
    }
  
    delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
      return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }
  }
  
  export const apiService = new ApiService(process.env.SERVER_URI || 'http://localhost:5000/api');
  