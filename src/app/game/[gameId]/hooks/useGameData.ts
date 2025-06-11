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
    if (!user || !gameId) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const authToken = await getAuthToken();
      if (!authToken) {
        throw new Error("Authentication token not available");
      }

      const headers = { Authorization: `Bearer ${authToken}` };

      // Fetch game data
      const gameResponse = await fetch(`/api/game/${gameId}`, { headers });
      if (!gameResponse.ok) {
        const errorData = await gameResponse.json();
        throw new Error(errorData.error?.message || "Failed to load game");
      }
      const gameData = await gameResponse.json();
      const game: Game = gameData.data;

      // Fetch game board
      const gameBoardResponse = await fetch(`/api/game/${gameId}/board`, {
        headers,
      });
      let gameBoard: Cell[] | null = null;
      if (gameBoardResponse.ok) {
        const gameBoardData = await gameBoardResponse.json();
        gameBoard = gameBoardData.data?.cells || [];
      }

      // Fetch player board
      const boardResponse = await fetch(
        `/api/game/${gameId}/playerBoard/${user.id}`,
        { headers },
      );
      let playerBoard: PlayerBoard | null = null;
      if (boardResponse.ok) {
        const boardData = await boardResponse.json();
        playerBoard = boardData.data;
      }

      setState((prev) => ({
        ...prev,
        game,
        gameBoard,
        playerBoard,
        isLoading: false,
      }));

      // Load additional data in parallel
      await Promise.all([refreshParticipants(), refreshSubmissions()]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load game data";
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
    if (!user || !gameId) return;

    let unsubscribe: (() => void) | undefined;

    const setupRealtimeListener = async () => {
      try {
        const { firestore } = await import("@/lib/firebase/client");
        const { doc, onSnapshot } = await import("firebase/firestore");

        const playerBoardRef = doc(
          firestore,
          "games",
          gameId,
          "playerBoards",
          user.id,
        );

        unsubscribe = onSnapshot(
          playerBoardRef,
          (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              const playerBoard: PlayerBoard = {
                userId: data.userId,
                cellStates: data.cellStates || {},
                completedLines: data.completedLines || [],
              };

              setState((prev) => ({
                ...prev,
                playerBoard,
              }));
            }
          },
          (error) => {
            console.error("Real-time listener error:", error);
          },
        );
      } catch (error) {
        console.error("Failed to setup real-time listener:", error);
      }
    };

    setupRealtimeListener();

    return () => {
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
