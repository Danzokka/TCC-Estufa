import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.BACKEND_URL || "http://localhost:5001",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Only access localStorage on the client side
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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

      // Clear token on authentication error
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }

      // Redirect to login page
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
