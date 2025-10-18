import { useCallback } from "react";
import { auth } from "@/lib/firebase/client";

interface FetchOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
}

interface UseAuthenticatedFetchReturn {
  getAuthToken: () => Promise<string | null>;
  authenticatedFetch: (
    url: string,
    options?: FetchOptions,
  ) => Promise<Response>;
}

/**
 * Custom hook for authenticated API calls
 * Provides centralized authentication token management and fetch operations
 *
 * @returns Object containing getAuthToken and authenticatedFetch functions
 *
 * @example
 * const { authenticatedFetch } = useAuthenticatedFetch();
 * const response = await authenticatedFetch('/api/game/123');
 */
export function useAuthenticatedFetch(): UseAuthenticatedFetchReturn {
  /**
   * Retrieves the current user's authentication token
   * Returns null if user is not authenticated or token retrieval fails
   */
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn("No authenticated user found");
        return null;
      }

      const token = await currentUser.getIdToken();
      return token;
    } catch (error) {
      console.error("Failed to get authentication token:", error);
      return null;
    }
  }, []);

  /**
   * Performs an authenticated fetch request
   * Automatically adds Authorization header with Firebase ID token
   *
   * @param url - The URL to fetch
   * @param options - Fetch options (headers will be merged with Authorization header)
   * @returns Promise<Response>
   * @throws Error if authentication token cannot be obtained
   */
  const authenticatedFetch = useCallback(
    async (url: string, options: FetchOptions = {}): Promise<Response> => {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      // Merge Authorization header with any provided headers
      const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      };

      return fetch(url, {
        ...options,
        headers,
      });
    },
    [getAuthToken],
  );

  return {
    getAuthToken,
    authenticatedFetch,
  };
}
