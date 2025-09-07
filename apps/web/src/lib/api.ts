import { getSession } from "@/server/actions/session";
import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.BACKEND_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  async (config) => {
    // Only in client side
    try {
      // Attempt to fetch the session token from the cookies via an endpoint
      const session = await getSession();
      if (!session.isLoggedIn) {
        return config; // If not logged in, return config without token
      }

      config.headers.Authorization = `Bearer ${session.token}`;
    } catch (error) {
      console.error("Error fetching auth token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common response scenarios
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle unauthorized errors (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Tentar renovar o token usando refresh token
        const session = await getSession();
        if (session.refreshToken && session.isLoggedIn) {
          const { refreshToken } = await import("@/server/actions/auth");
          await refreshToken(session.refreshToken);

          // Tentar novamente a requisição original
          const newSession = await getSession();
          originalRequest.headers.Authorization = `Bearer ${newSession.token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
      }

      // Se não conseguir renovar, redirecionar para login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
