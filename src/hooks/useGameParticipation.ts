import { useCallback, useEffect, useState } from "react";
import type { User } from "@/types/schema";
import { useAuthenticatedFetch } from "./useAuthenticatedFetch";

interface UseGameParticipationReturn {
  /**
   * Participation status:
   * - true: User is participating in the game
   * - false: User is not participating
   * - null: Loading state (check in progress)
   */
  isParticipating: boolean | null;
  /**
   * Loading indicator for the participation check
   */
  isLoading: boolean;
  /**
   * Error that occurred during participation check
   */
  error: Error | null;
  /**
   * Manually trigger a re-check of participation status
   */
  refresh: () => Promise<void>;
}

/**
 * Custom hook to check if a user is participating in a game
 * Automatically checks participation when user or gameId changes
 * Provides manual refresh capability for real-time updates
 *
 * @param gameId - The ID of the game to check
 * @param user - The current authenticated user
 * @returns Object containing participation status, loading state, error, and refresh function
 *
 * @example
 * const { isParticipating, isLoading, refresh } = useGameParticipation(gameId, user);
 *
 * if (isParticipating === null) return <div>Checking participation...</div>;
 * if (isParticipating) return <div>Welcome back!</div>;
 */
export function useGameParticipation(
  gameId: string,
  user: User | null,
): UseGameParticipationReturn {
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [isParticipating, setIsParticipating] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Checks if the current user is participating in the game
   * Queries the participants API and searches for the user in the list
   */
  const checkParticipation = useCallback(async () => {
    // Reset to null to indicate loading state
    setIsParticipating(null);
    setIsLoading(true);
    setError(null);

    // Cannot check participation without a user
    if (!user) {
      setIsParticipating(false);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch participants list for this game
      const response = await authenticatedFetch(
        `/api/game/${gameId}/participants`,
      );

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.data) {
          // Check if current user is in the participants list
          // Note: API returns 'id' field, not 'userId'
          const isUserParticipating = data.data.some(
            (participant: { id: string }) => participant.id === user.id,
          );
          setIsParticipating(isUserParticipating);
        } else {
          setIsParticipating(false);
        }
      } else {
        setIsParticipating(false);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err : new Error("Failed to check participation");
      console.error("Error checking participation:", errorMessage);
      setError(errorMessage);
      setIsParticipating(false);
    } finally {
      setIsLoading(false);
    }
  }, [user, gameId, authenticatedFetch]);

  /**
   * Public refresh function for manual participation checks
   * Useful after joining a game or when suspecting state changes
   */
  const refresh = useCallback(async () => {
    await checkParticipation();
  }, [checkParticipation]);

  // Automatically check participation when user or gameId changes
  useEffect(() => {
    checkParticipation();
  }, [checkParticipation]);

  return {
    isParticipating,
    isLoading,
    error,
    refresh,
  };
}
