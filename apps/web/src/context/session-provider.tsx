"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import authService, { UserData } from "@/services/auth-service";
import { useRouter } from "next/navigation";
import { login as serverLogin, logout as serverLogout } from "@/app/actions";

// Define the shape of our session context
interface SessionContextType {
  user: UserData | null;
  loading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, name:string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context with undefined as default value
const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const userData = await authService.getCurrentUser();

        if (userData) {
          setUser(userData);

          // Store token for API calls if not already stored
          if (userData.token && typeof window !== "undefined") {
            localStorage.setItem("token", userData.token);
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to check authentication")
        );
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handle user login
  const handleLogin = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // Call auth service to login
      const userData = await authService.login({ email, password });

      // Store token for API calls
      if (typeof window !== "undefined") {
        localStorage.setItem("token", userData.token);
      }

      // Update user state
      setUser(userData);

      // Use server action to save session
      await serverLogin({
        userid: userData.id,
        username: userData.username,
        email: userData.email,
        token: userData.token,
        isLoggedIn: true,
      });

      // Navigate to dashboard
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Login failed"));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Handle user signup
  const handleSignup = async (
    username: string,
    name: string,
    email: string,
    password: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Call auth service to register
      const userData = await authService.signup({ username, name, email, password });

      // Store token for API calls
      if (typeof window !== "undefined") {
        localStorage.setItem("token", userData.token);
      }

      // Update user state
      setUser(userData);

      // Use server action to save session
      await serverLogin({
        userid: userData.id,
        username: userData.username,
        email: userData.email,
        token: userData.token,
        isLoggedIn: true,
      });

      // Navigate to dashboard
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Signup failed"));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      setLoading(true);

      // Call auth service to logout
      await authService.logout();

      // Use server action to destroy session
      await serverLogout();

      // Reset user state
      setUser(null);

      // Navigate to login
      router.push("/auth/login");
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Logout failed"));
    } finally {
      setLoading(false);
    }
  };

  // Create context value
  const value = {
    user,
    loading,
    error,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

// Custom hook for using the session context
export function useSession() {
  const context = useContext(SessionContext);

  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }

  return context;
}
