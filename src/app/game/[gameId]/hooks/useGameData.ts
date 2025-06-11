import type { Participant } from "@/components/game/ParticipantsList";
import { useAuth } from "@/contexts/AuthContext";
import type { Cell, Game, PlayerBoard, Submission } from "@/types/schema";
import { useCallback, useEffect, useState } from "react";

interface GameDataState {
  game: Game | null;
  gameBoard: Cell[] | null;
  playerBoard: PlayerBoard | null;
  participants: Participant[];
  submissions: Submission[];
  isLoading: boolean;
  error: string | null;
  isUploading: boolean;
}

/**
 * Hook for managing game data and real-time updates
 * Handles initial data loading, Firestore listeners, and data refresh operations
 */
export function useGameData(gameId: string) {
  const { user } = useAuth();
  const [state, setState] = useState<GameDataState>({
    game: null,
    gameBoard: null,
    playerBoard: null,
    participants: [],
    submissions: [],
    isLoading: true,
    error: null,
    isUploading: false,
  });

  /**
   * Fetches authentication token for API calls
   * Centralized token management to avoid repetition
   */
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    try {
      const { auth } = await import("@/lib/firebase/client");
      return (await auth.currentUser?.getIdToken()) || null;
    } catch (error) {
      console.error("Failed to get auth token:", error);
      return null;
    }
  }, []);

  /**
   * Loads initial game data from multiple API endpoints
   * Fetches game info, board layout, and player board state
   */
  const loadGameData = useCallback(async () => {
    console.log("ℹ️ XXX: ~ useGameData.ts ~ loadGameData called", {
      userExists: !!user,
      gameId,
      userId: user?.id,
    });

    if (!user || !gameId) {
      console.log(
        "ℹ️ XXX: ~ useGameData.ts ~ Skipping loadGameData - missing user or gameId",
      );
      return;
    }

    try {
      console.log("ℹ️ XXX: ~ useGameData.ts ~ Starting game data load");
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const authToken = await getAuthToken();
      if (!authToken) {
        throw new Error("Authentication token not available");
      }

      const headers = { Authorization: `Bearer ${authToken}` };

      // Fetch game data
      console.log("ℹ️ XXX: ~ useGameData.ts ~ Fetching game data");
      const gameResponse = await fetch(`/api/game/${gameId}`, { headers });
      if (!gameResponse.ok) {
        const errorData = await gameResponse.json();
        throw new Error(errorData.error?.message || "Failed to load game");
      }
      const gameData = await gameResponse.json();
      const game: Game = gameData.data;
      console.log("ℹ️ XXX: ~ useGameData.ts ~ Game data loaded", {
        gameTitle: game.title,
        requiredBingoLines: game.requiredBingoLines,
      });

      // Fetch game board
      console.log("ℹ️ XXX: ~ useGameData.ts ~ Fetching game board");
      const gameBoardResponse = await fetch(`/api/game/${gameId}/board`, {
        headers,
      });
      let gameBoard: Cell[] | null = null;
      if (gameBoardResponse.ok) {
        const gameBoardData = await gameBoardResponse.json();
        gameBoard = gameBoardData.data?.cells || [];
        console.log("ℹ️ XXX: ~ useGameData.ts ~ Game board loaded", {
          cellCount: gameBoard?.length || 0,
        });
      } else {
        console.warn("ℹ️ XXX: ~ useGameData.ts ~ Failed to load game board", {
          status: gameBoardResponse.status,
        });
      }

      // Fetch player board
      console.log("ℹ️ XXX: ~ useGameData.ts ~ Fetching player board");
      const boardResponse = await fetch(
        `/api/game/${gameId}/playerBoard/${user.id}`,
        { headers },
      );
      let playerBoard: PlayerBoard | null = null;
      if (boardResponse.ok) {
        const boardData = await boardResponse.json();
        playerBoard = boardData.data;
        console.log("ℹ️ XXX: ~ useGameData.ts ~ Player board loaded", {
          playerBoard,
          completedLinesCount: playerBoard?.completedLines?.length || 0,
          cellStatesCount: Object.keys(playerBoard?.cellStates || {}).length,
        });
      } else {
        console.warn("ℹ️ XXX: ~ useGameData.ts ~ Failed to load player board", {
          status: boardResponse.status,
        });
      }

      console.log("ℹ️ XXX: ~ useGameData.ts ~ Setting initial state");
      setState((prev) => ({
        ...prev,
        game,
        gameBoard,
        playerBoard,
        isLoading: false,
      }));

      // Load additional data in parallel
      console.log("ℹ️ XXX: ~ useGameData.ts ~ Loading additional data");
      await Promise.all([refreshParticipants(), refreshSubmissions()]);
      console.log("ℹ️ XXX: ~ useGameData.ts ~ All data loaded successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load game data";
      console.error("ℹ️ XXX: ~ useGameData.ts ~ Error loading game data:", {
        error,
        errorMessage,
      });
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    }
  }, [user, gameId, getAuthToken]);

  /**
   * Refreshes participants data from API
   * Called after successful image submissions to update completion stats
   */
  const refreshParticipants = useCallback(async () => {
    if (!user || !gameId) return;

    try {
      const authToken = await getAuthToken();
      if (!authToken) return;

      const response = await fetch(`/api/game/${gameId}/participants`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setState((prev) => ({
          ...prev,
          participants: data.data || [],
        }));
      }
    } catch (error) {
      console.error("Failed to refresh participants:", error);
    }
  }, [user, gameId, getAuthToken]);

  /**
   * Refreshes user's submissions data from API
   * Fetches latest submissions to show recent upload results
   */
  const refreshSubmissions = useCallback(async () => {
    if (!user || !gameId) return;

    try {
      const authToken = await getAuthToken();
      if (!authToken) return;

      const response = await fetch(
        `/api/game/${gameId}/submission?userId=${user.id}&limit=10`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setState((prev) => ({
          ...prev,
          submissions: data.data || [],
        }));
      } else {
        console.error(
          "Failed to fetch submissions:",
          response.status,
          response.statusText,
        );
        // Prevent infinite loading by setting empty array
        setState((prev) => ({
          ...prev,
          submissions: [],
        }));
      }
    } catch (error) {
      console.error("Failed to refresh submissions:", error);
      setState((prev) => ({
        ...prev,
        submissions: [],
      }));
    }
  }, [user, gameId, getAuthToken]);

  /**
   * Sets up real-time Firestore listener for player board updates
   * Enables immediate UI updates when cells are opened via image submissions
   */
  useEffect(() => {
    console.log("ℹ️ XXX: ~ useGameData.ts ~ Setting up Firestore listener", {
      userExists: !!user,
      gameId,
      userId: user?.id,
    });

    if (!user || !gameId) {
      console.log(
        "ℹ️ XXX: ~ useGameData.ts ~ Skipping listener setup - missing user or gameId",
      );
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const setupRealtimeListener = async () => {
      try {
        console.log("ℹ️ XXX: ~ useGameData.ts ~ Importing Firebase modules");
        const { firestore } = await import("@/lib/firebase/client");
        const { doc, onSnapshot } = await import("firebase/firestore");

        const playerBoardRef = doc(
          firestore,
          "games",
          gameId,
          "playerBoards",
          user.id,
        );

        console.log(
          "ℹ️ XXX: ~ useGameData.ts ~ Setting up onSnapshot listener",
          {
            path: `games/${gameId}/playerBoards/${user.id}`,
          },
        );

        unsubscribe = onSnapshot(
          playerBoardRef,
          (doc) => {
            console.log(
              "ℹ️ XXX: ~ useGameData.ts ~ Firestore snapshot received",
              {
                docExists: doc.exists(),
                docId: doc.id,
                metadata: doc.metadata,
              },
            );

            if (doc.exists()) {
              const data = doc.data();
              console.log(
                "ℹ️ XXX: ~ useGameData.ts ~ PlayerBoard data from Firestore",
                {
                  rawData: data,
                  cellStatesCount: Object.keys(data.cellStates || {}).length,
                  completedLinesCount: (data.completedLines || []).length,
                },
              );

              const playerBoard: PlayerBoard = {
                userId: data.userId,
                cellStates: data.cellStates || {},
                completedLines: data.completedLines || [],
              };

              console.log(
                "ℹ️ XXX: ~ useGameData.ts ~ Updating playerBoard state",
                {
                  playerBoard,
                  completedLinesDetails: playerBoard.completedLines,
                },
              );

              setState((prev) => ({
                ...prev,
                playerBoard,
              }));
            } else {
              console.log(
                "ℹ️ XXX: ~ useGameData.ts ~ PlayerBoard document does not exist",
              );
            }
          },
          (error) => {
            console.error(
              "ℹ️ XXX: ~ useGameData.ts ~ Real-time listener error:",
              error,
            );
          },
        );

        console.log(
          "ℹ️ XXX: ~ useGameData.ts ~ Firestore listener setup completed",
        );
      } catch (error) {
        console.error(
          "ℹ️ XXX: ~ useGameData.ts ~ Failed to setup real-time listener:",
          error,
        );
      }
    };

    setupRealtimeListener();

    return () => {
      console.log("ℹ️ XXX: ~ useGameData.ts ~ Cleaning up Firestore listener");
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, gameId]);

  // Load initial data on mount
  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  return {
    ...state,
    refreshParticipants,
    refreshSubmissions,
    setIsUploading: (isUploading: boolean) =>
      setState((prev) => ({ ...prev, isUploading })),
  };
}
