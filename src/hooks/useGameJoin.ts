import { useCallback, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { trackGameJoined } from "@/lib/analytics";
import { useAuthenticatedFetch } from "./useAuthenticatedFetch";

interface GameJoinResult {
  success: boolean;
  data?: {
    participationId: string;
    alreadyParticipating?: boolean;
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

interface UseGameJoinReturn {
  /**
   * Join a game by gameId
   * Returns a promise with success status and participation data
   */
  joinGame: (gameId: string) => Promise<GameJoinResult>;
  /**
   * Indicates if a join operation is in progress
   */
  isJoining: boolean;
  /**
   * Error message from the last join attempt (if any)
   */
  error: string | null;
  /**
   * Clears the current error state
   */
  clearError: () => void;
}

/**
 * Custom hook for joining games
 * Handles the complete game join workflow including API calls and error handling
 *
 * @returns Object containing joinGame function, loading state, and error state
 *
 * @example
 * const { joinGame, isJoining, error } = useGameJoin();
 *
 * const handleJoin = async () => {
 *   const result = await joinGame('ABC123');
 *   if (result.success) {
 *     router.push(`/game/${gameId}`);
 *   }
 * };
 */
export function useGameJoin(): UseGameJoinReturn {
  const { refreshUser } = useAuth();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear the current error state
   * Useful for resetting error messages before retry attempts
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Attempts to join a game
   * Handles all API communication and error scenarios
   *
   * @param gameId - The ID of the game to join
   * @returns Promise<GameJoinResult> with success status and data
   */
  const joinGame = useCallback(
    async (gameId: string): Promise<GameJoinResult> => {
      setIsJoining(true);
      setError(null);

      try {
        const response = await authenticatedFetch(`/api/game/${gameId}/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const responseData: GameJoinResult = await response.json();

        if (!response.ok) {
          // Server returned an error response
          const errorMessage =
            responseData.error?.message || "Failed to join game";
          setError(errorMessage);

          return {
            success: false,
            error: responseData.error || {
              code: "JOIN_FAILED",
              message: errorMessage,
            },
          };
        }

        if (!responseData.success) {
          // Response was OK but API indicates failure
          const errorMessage =
            responseData.error?.message || "Failed to join game";
          setError(errorMessage);

          return {
            success: false,
            error: responseData.error || {
              code: "JOIN_FAILED",
              message: errorMessage,
            },
          };
        }

        // Successfully joined the game
        // Refresh user data to update participatingGames array
        // Why: The join operation updates user's participatingGames in Firestore,
        // but AuthContext cache is not automatically invalidated
        try {
          await refreshUser();
        } catch (refreshErr) {
          // Log but don't fail the join operation if refresh fails
          console.error("Failed to refresh user after game join:", refreshErr);
        }

        // Track game join event
        trackGameJoined(gameId);

        return {
          success: true,
          data: responseData.data,
        };
      } catch (err) {
        // Network or other unexpected error
        const errorMessage =
          err instanceof Error ? err.message : "Failed to join game";
        console.error("Error joining game:", err);
        setError(errorMessage);

        return {
          success: false,
          error: {
            code: "NETWORK_ERROR",
            message: errorMessage,
          },
        };
      } finally {
        setIsJoining(false);
      }
    },
    [authenticatedFetch, refreshUser],
  );

  return {
    joinGame,
    isJoining,
    error,
    clearError,
  };
}
