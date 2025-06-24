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

      // Redirect to login page, session will be cleared by the server
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
