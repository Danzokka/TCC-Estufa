import api from "@/lib/api";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  username: string;
  name: string;
  email: string;
  password: string;
}

export interface UserData {
  id: string;
  username: string;
  email: string;
  token: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<UserData> {
    const response = await api.post<UserData>("/auth/login", credentials);
    return response.data;
  },

  async signup(userData: SignupData): Promise<UserData> {
    const response = await api.post<UserData>("/user", userData);
    return response.data;
  },

  async logout(): Promise<void> {
    // Clear token from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }

    // Optionally, notify the server about logout
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  },

  async getCurrentUser(): Promise<UserData | null> {
    try {
      const response = await api.get<UserData>("/auth/me");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      return null;
    }
  },
};

export default authService;
