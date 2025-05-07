import {
  type User,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
} from "firebase/auth";
import { auth } from "./client";

/**
 * Register a new user with username and password
 * This uses Firebase anonymous auth and then stores user data in Firestore
 */
export async function registerUser(
  username: string,
  password: string,
): Promise<{
  success: boolean;
  error?: string;
  userId?: string;
}> {
  try {
    // First check if the username is available via API
    const checkResponse = await fetch("/api/auth/check-username", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });

    const checkData = await checkResponse.json();
    if (!checkData.available) {
      return {
        success: false,
        error: "Username is already taken",
      };
    }

    // Create anonymous user in Firebase Auth
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;

    // Register user with username and password via API
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await user.getIdToken()}`,
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // If registration fails, delete the anonymous user
      await user.delete();
      return {
        success: false,
        error: data.error || "Registration failed",
      };
    }

    return {
      success: true,
      userId: user.uid,
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Login with username and password
 */
export async function loginUser(
  username: string,
  password: string,
): Promise<{
  success: boolean;
  error?: string;
  userId?: string;
}> {
  try {
    // Login via API
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Login failed",
      };
    }

    // The API returns a custom token that we can use to sign in
    const { customToken } = data;

    // Sign in with the custom token
    await signInWithCustomToken(auth, customToken);

    const currentUser = auth.currentUser;

    return {
      success: true,
      userId: currentUser?.uid,
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Logout the current user
 */
export async function logoutUser(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Call logout API to clean up server-side session
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    // Sign out from Firebase Auth
    await firebaseSignOut(auth);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Logout error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Listen for auth state changes
 */
export function onAuthChange(
  callback: (user: User | null) => void,
): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  username: string,
  currentPassword: string,
  newPassword?: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const idToken = await auth.currentUser.getIdToken();

    // Update profile via API
    const response = await fetch("/api/auth/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        username,
        currentPassword,
        newPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Update failed",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Update profile error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
