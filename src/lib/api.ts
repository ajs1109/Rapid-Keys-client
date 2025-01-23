import { apiService } from "@/lib/services/apiService";
import { authService } from "@/lib/services/authService";
import { User } from "@/lib/types/auth";
import ApiClient from "./utils/apiClient";

export const login = async (email: string, password: string) => {
    ApiClient.sendHttpPost<any>({email, password},`/auth/login`).then((response) => {
      console.dir('response from apiClient: ' + response);
    });
};

export const signUp = async (username: string, email: string, password: string) => {
  authService.signup(username, email, password);
};

export const logout = async () => {
  authService.logout();
};

export const generateText = async (words: number) => {
   const response = await apiService.get<{text: string} | null>('/generate-text');
   return response?.text;
}