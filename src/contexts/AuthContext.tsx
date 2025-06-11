"use client";

import { signInWithCustomToken } from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { auth } from "@/lib/firebase/client";
import type { User } from "@/types/schema";

// Define the auth context type
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    password: string,
    isTestUser?: boolean,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

// Create the auth context with a default value
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Debug output for auth state
  useEffect(() => {
    console.log("ℹ️ XXX: ~ AuthContext.tsx ~ Auth state:", {
      isLoggedIn: !!user,
      loading,
    });
    if (user) {
      console.log("ℹ️ XXX: ~ AuthContext.tsx ~ User info:", {
        id: user.id,
        username: user.username,
      });
    }
  }, [user, loading]);

  // Initialize auth state
  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(
      async (firebaseUser) => {
        setLoading(true);
        try {
          if (firebaseUser) {
            // Get user data from Firestore
            const token = await firebaseUser.getIdToken();
            const response = await fetch("/api/auth/me", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (!response.ok) {
              throw new Error("Failed to fetch user data");
            }

            const data = await response.json();
            if (data.success) {
              setUser(data.data.user);
            } else {
              throw new Error(data.error.message);
            }
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error("Auth state error:", err);
          setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Auth state error:", err);
        setError(err);
        setLoading(false);
      },
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Login function
  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error.message);
      }

      if (data.success) {
        // Store token in localStorage
        localStorage.setItem("authToken", data.data.token);

        // Sign in with custom token
        await signInWithCustomToken(auth, data.data.token);
        setUser(data.data.user);
      } else {
        throw new Error(data.error.message);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(
    async (username: string, password: string, isTestUser = false) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password, isTestUser }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error.message);
        }

        if (data.success) {
          // Store token in localStorage
          localStorage.setItem("authToken", data.data.token);

          // Sign in with custom token
          await signInWithCustomToken(auth, data.data.token);
          setUser(data.data.user);
        } else {
          throw new Error(data.error.message);
        }
      } catch (err) {
        console.error("Registration error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Logout function
  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (user) {
        // Call logout API
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user.id }),
        });
      }

      // Remove token from localStorage
      localStorage.removeItem("authToken");

      // Sign out from Firebase
      await auth.signOut();
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update user function
  const updateUser = useCallback(
    async (userData: Partial<User>) => {
      if (!user) {
        throw new Error("No user logged in");
      }

      setLoading(true);
      setError(null);
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          throw new Error("Not authenticated");
        }

        const response = await fetch("/api/auth/update", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            ...userData,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error.message);
        }

        if (data.success) {
          setUser(data.data.user);
        } else {
          throw new Error(data.error.message);
        }
      } catch (err) {
        console.error("Update user error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  // Memoize the context value
  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, loading, error, login, register, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
