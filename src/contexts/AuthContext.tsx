"use client";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  onAuthChange,
  registerUser,
  updateUserProfile,
} from "@/lib/firebase/auth";
import type { User as UserModel } from "@/models/User";
import type { User } from "firebase/auth";
import { useTranslations } from "next-intl";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// Define the shape of the user profile data
// This is a simplified version of the User model for client-side use
type UserProfile = Pick<UserModel, "id" | "username"> & {
  createdAt: string;
  lastLoginAt: string;
};

// Define the shape of the auth context
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  register: (username: string, password: string) => Promise<boolean>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  updateProfile: (
    username: string,
    currentPassword: string,
    newPassword?: string,
  ) => Promise<boolean>;
  clearError: () => void;
}

// Create the auth context with a default value
export const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  isLoading: true,
  error: null,
  register: async () => false,
  login: async () => false,
  logout: async () => false,
  updateProfile: async () => false,
  clearError: () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("Auth.errors");
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clear any error messages
  const clearError = () => setError(null);

  // Fetch user profile from Firestore
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      } else {
        console.error("Failed to fetch user profile");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }, []);

  // Register a new user
  const register = async (username: string, password: string) => {
    setIsLoading(true);
    clearError();

    try {
      const result = await registerUser(username, password);

      if (!result.success) {
        // Map error messages to translation keys
        let errorKey = "registrationFailed";
        if (result.error === "Username is already taken") {
          errorKey = "usernameTaken";
        }
        setError(t(errorKey));
        setIsLoading(false);
        return false;
      }

      // User will be set by the auth state change listener
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      setError(t("unexpectedError"));
      setIsLoading(false);
      return false;
    }
  };

  // Login a user
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    clearError();

    try {
      const result = await loginUser(username, password);

      if (!result.success) {
        // Map error messages to translation keys
        let errorKey = "loginFailed";
        if (result.error === "Invalid username or password") {
          errorKey = "invalidCredentials";
        }
        setError(t(errorKey));
        setIsLoading(false);
        return false;
      }

      // User will be set by the auth state change listener
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      setError(t("unexpectedError"));
      setIsLoading(false);
      return false;
    }
  };

  // Logout the current user
  const logout = async () => {
    setIsLoading(true);
    clearError();

    try {
      const result = await logoutUser();

      if (!result.success) {
        setError(t("logoutFailed"));
        setIsLoading(false);
        return false;
      }

      // User will be set to null by the auth state change listener
      setUserProfile(null);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      setError(t("unexpectedError"));
      setIsLoading(false);
      return false;
    }
  };

  // Update user profile
  const updateProfile = async (
    username: string,
    currentPassword: string,
    newPassword?: string,
  ) => {
    setIsLoading(true);
    clearError();

    try {
      const result = await updateUserProfile(
        username,
        currentPassword,
        newPassword,
      );

      if (!result.success) {
        // Map error messages to translation keys
        let errorKey = "updateFailed";
        if (result.error === "Not authenticated") {
          errorKey = "notAuthenticated";
        }
        setError(t(errorKey));
        setIsLoading(false);
        return false;
      }

      // Refresh user profile
      if (user) {
        await fetchUserProfile(user.uid);
      }

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Profile update error:", error);
      setError(t("unexpectedError"));
      setIsLoading(false);
      return false;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      setUser(authUser);

      if (authUser) {
        // Fetch user profile when user is authenticated
        await fetchUserProfile(authUser.uid);
      } else {
        setUserProfile(null);
      }

      setIsLoading(false);
    });

    // Initialize with current user
    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      fetchUserProfile(currentUser.uid);
    }

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [fetchUserProfile]);

  // Context value
  const value = {
    user,
    userProfile,
    isLoading,
    error,
    register,
    login,
    logout,
    updateProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
