import { AuthResponse } from "@/types/auth";
import { ApiService } from "@/utils/apiService"
class AuthService {
    private accessToken: string | null = null;
    private refreshTimer: NodeJS.Timeout | null = null;
  
    constructor(private api: ApiService) {
      this.setupRefreshCycle();
    }
  
    private setupRefreshCycle() {
      const REFRESH_INTERVAL = 14 * 60 * 1000;
      
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
      }
  
      this.refreshTimer = setInterval(async () => {
        try {
          await this.refreshToken();
        } catch (error) {
          this.logout();
        }
      }, REFRESH_INTERVAL);
    }
  
    async login(email: string, password: string): Promise<void> {
      const response = await this.api.post<AuthResponse>('/auth/login', {
        email,
        password
      });
      
      this.accessToken = response.accessToken;
      this.setupRefreshCycle();
    }
  
    async refreshToken(): Promise<void> {
      try {
        const response = await this.api.post<{ accessToken: string }>('/auth/refresh');
        this.accessToken = response.accessToken;
      } catch (error) {
        this.accessToken = null;
        throw error;
      }
    }
  
    async logout(): Promise<void> {
      try {
        await this.api.post('/auth/logout');
      } finally {
        if (this.refreshTimer) {
          clearInterval(this.refreshTimer);
        }
        this.accessToken = null;
        // Clear user data from your state management
        // store.dispatch(clearUser());
      }
    }
  
    getAccessToken(): string | null {
      return this.accessToken;
    }
  }
  