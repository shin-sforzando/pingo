import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";
import type { GameInfo, User } from "@/types/schema";

interface UseParticipatingGamesOptions {
  /**
   * Whether to fetch detailed game information (theme, notes, participantCount, etc.)
   * Set to false for lightweight usage like navigation menus
   * @default true
   */
  fetchDetails?: boolean;
}

/**
 * Custom hook to fetch and manage participating games for the current user
 * Automatically filters out expired games and optionally fetches detailed information
 *
 * @param user - The current authenticated user
 * @param options - Configuration options for data fetching
 * @returns Object containing participating games, loading state, and error
 *
 * @example
 * // Detailed usage (for game lists)
 * const { participatingGames, isLoading } = useParticipatingGames(user);
 *
 * @example
 * // Minimal usage (for navigation menus)
 * const { participatingGames, isLoading } = useParticipatingGames(user, { fetchDetails: false });
 */
export function useParticipatingGames(
  user: User | null,
  options: UseParticipatingGamesOptions = {},
) {
  const { fetchDetails = true } = options;

  const [participatingGames, setParticipatingGames] = useState<GameInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Extract stable values from user object to avoid unnecessary re-renders
  const userId = user?.id;
  const participatingGameIdsKey = user?.participatingGames?.join(",") || "";

  useEffect(() => {
    const fetchParticipatingGames = async () => {
      if (!userId) {
        setParticipatingGames([]);
        setIsLoading(false);
        return;
      }

      if (!participatingGameIdsKey) {
        setParticipatingGames([]);
        setIsLoading(false);
        return;
      }

      const participatingGameIds = participatingGameIdsKey.split(",");

      setIsLoading(true);
      setError(null);

      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
          setIsLoading(false);
          return;
        }

        const games: GameInfo[] = [];

        // Fetch game information for each participating game
        await Promise.all(
          participatingGameIds.map(async (gameId) => {
            try {
              // Always fetch basic game info
              const gameResponse = await fetch(`/api/game/${gameId}`, {
                headers: {
                  Authorization: `Bearer ${idToken}`,
                },
              });

              if (gameResponse.ok) {
                const gameData = await gameResponse.json();
                if (gameData.success && gameData.data) {
                  // Check if game has not expired
                  const expiresAt = gameData.data.expiresAt
                    ? new Date(gameData.data.expiresAt)
                    : null;
                  const now = new Date();

                  if (!expiresAt || expiresAt > now) {
                    const gameInfo: GameInfo = {
                      id: gameData.data.id,
                      title: gameData.data.title,
                      theme: "",
                      participantCount: 0,
                      createdAt: null,
                      expiresAt: null,
                    };

                    // Optionally fetch detailed information
                    if (fetchDetails) {
                      gameInfo.theme = gameData.data.theme;
                      gameInfo.notes = gameData.data.notes;
                      gameInfo.createdAt = gameData.data.createdAt
                        ? new Date(gameData.data.createdAt)
                        : null;
                      gameInfo.expiresAt = expiresAt;

                      // Fetch participant count
                      try {
                        const participantsResponse = await fetch(
                          `/api/game/${gameId}/participants`,
                          {
                            headers: {
                              Authorization: `Bearer ${idToken}`,
                            },
                          },
                        );

                        if (participantsResponse.ok) {
                          const participantsData =
                            await participantsResponse.json();
                          if (
                            participantsData.success &&
                            Array.isArray(participantsData.data)
                          ) {
                            gameInfo.participantCount =
                              participantsData.data.length;
                          }
                        }
                      } catch (error) {
                        // Silently fail participant count fetch
                        console.error(
                          `Failed to fetch participants for ${gameId}:`,
                          error,
                        );
                      }
                    }

                    games.push(gameInfo);
                  }
                }
              }
              // Silently skip games that return 404 or other errors
            } catch (error) {
              console.error(`Failed to fetch game info for ${gameId}:`, error);
            }
          }),
        );

        setParticipatingGames(games);
      } catch (err) {
        console.error("Failed to fetch participating games:", err);
        setError(
          err instanceof Error ? err : new Error("Unknown error occurred"),
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipatingGames();
  }, [userId, participatingGameIdsKey, fetchDetails]);

  return { participatingGames, isLoading, error };
}
