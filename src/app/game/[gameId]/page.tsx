"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { BingoBoard } from "@/components/game/BingoBoard";
import type { BingoCellState } from "@/components/game/BingoCell";
import { GameInfo } from "@/components/game/GameInfo";
import { ImageUpload } from "@/components/game/ImageUpload";
import { ParticipantsList } from "@/components/game/ParticipantsList";
import type { Participant } from "@/components/game/ParticipantsList";
import { SubmissionResult } from "@/components/game/SubmissionResult";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { AcceptanceStatus } from "@/types/common";
import type {
  Cell,
  Game,
  ImageSubmissionResult,
  PlayerBoard,
  Submission,
} from "@/types/schema";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

// State management types for game page
interface GamePageState {
  game: Game | null;
  gameBoard: Cell[] | null;
  playerBoard: PlayerBoard | null;
  participants: Participant[];
  submissions: Submission[];
  isLoading: boolean;
  error: string | null;
  isUploading: boolean;
}

// Handler type for upload completion
type UploadCompleteHandler = (
  success: boolean,
  result?: ImageSubmissionResult,
  error?: string,
) => void;

/**
 * Error display component for inline error messages
 * Used throughout the page to show errors without disrupting user flow
 */
function ErrorDisplay({
  error,
  className,
}: {
  error: string | null;
  className?: string;
}) {
  if (!error) return null;

  return (
    <div
      className={cn(
        "rounded-md border border-destructive/20 bg-destructive/10 p-3 text-destructive text-sm",
        className,
      )}
    >
      {error}
    </div>
  );
}

/**
 * Game header component displaying game title and basic info
 * Provides context for the current game session
 */
function GameHeader({
  game,
  className,
}: {
  game: Game | null;
  className?: string;
}) {
  const t = useTranslations("Game");

  if (!game) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-center font-bold text-2xl">
          {game.title}
        </CardTitle>
        {game.theme && (
          <p className="text-center text-muted-foreground text-sm">
            {t("theme")}: {game.theme}
          </p>
        )}
      </CardHeader>
    </Card>
  );
}

/**
 * Custom hook for managing game data and real-time updates
 * Handles Firestore listeners for bingo board state and manual refresh for other data
 */
function useGameData(gameId: string) {
  const { user } = useAuth();
  const [state, setState] = useState<GamePageState>({
    game: null,
    gameBoard: null,
    playerBoard: null,
    participants: [],
    submissions: [],
    isLoading: true,
    error: null,
    isUploading: false,
  });

  // Load initial game data
  const loadGameData = useCallback(async () => {
    if (!user || !gameId) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Get authentication token for API calls
      const { auth } = await import("@/lib/firebase/client");
      const authToken = await auth.currentUser?.getIdToken();
      if (!authToken) {
        throw new Error("Authentication token not available");
      }

      // Fetch game data
      const gameResponse = await fetch(`/api/game/${gameId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!gameResponse.ok) {
        const errorData = await gameResponse.json();
        throw new Error(errorData.error?.message || "Failed to load game");
      }

      const gameData = await gameResponse.json();
      const game: Game = gameData.data;

      // Fetch game board
      const gameBoardResponse = await fetch(`/api/game/${gameId}/board`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      let gameBoard: Cell[] | null = null;
      if (gameBoardResponse.ok) {
        const gameBoardData = await gameBoardResponse.json();
        gameBoard = gameBoardData.data?.cells || [];
      }

      // Fetch player board
      const boardResponse = await fetch(
        `/api/game/${gameId}/playerBoard/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
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

      // Load additional data
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
  }, [user, gameId]);

  // Refresh participants data
  const refreshParticipants = useCallback(async () => {
    if (!user || !gameId) return;

    try {
      const { auth } = await import("@/lib/firebase/client");
      const authToken = await auth.currentUser?.getIdToken();
      if (!authToken) return;

      const response = await fetch(`/api/game/${gameId}/participants`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
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
  }, [user, gameId]);

  // Refresh submissions data
  const refreshSubmissions = useCallback(async () => {
    if (!user || !gameId) return;

    try {
      const { auth } = await import("@/lib/firebase/client");
      const authToken = await auth.currentUser?.getIdToken();
      if (!authToken) return;

      const response = await fetch(
        `/api/game/${gameId}/submission?userId=${user.id}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
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
        // Set empty submissions array on error to prevent infinite loading
        setState((prev) => ({
          ...prev,
          submissions: [],
        }));
      }
    } catch (error) {
      console.error("Failed to refresh submissions:", error);
      // Set empty submissions array on error to prevent infinite loading
      setState((prev) => ({
        ...prev,
        submissions: [],
      }));
    }
  }, [user, gameId]);

  // Set up real-time listeners for player board
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
              // Convert Firestore timestamp to Date for type safety
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

/**
 * Custom hook for handling image submission workflow
 * Manages upload state and triggers data refresh after successful submission
 */
function useImageSubmission(
  refreshParticipants: () => Promise<void>,
  refreshSubmissions: () => Promise<void>,
  setIsUploading: (isUploading: boolean) => void,
) {
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleUploadComplete: UploadCompleteHandler = useCallback(
    async (success, result, error) => {
      setIsUploading(false);

      if (success && result) {
        setSubmissionError(null);
        // Refresh data after successful upload to show updated state
        await Promise.all([refreshParticipants(), refreshSubmissions()]);
      } else {
        setSubmissionError(error || "Upload failed");
      }
    },
    [refreshParticipants, refreshSubmissions, setIsUploading],
  );

  const handleUploadStart = useCallback(() => {
    setIsUploading(true);
    setSubmissionError(null);
  }, [setIsUploading]);

  return {
    submissionError,
    handleUploadComplete,
    handleUploadStart,
  };
}

/**
 * Main game page component
 * Displays the complete game interface with all required sections
 */
export default function GamePage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const t = useTranslations("Game");
  const { user } = useAuth();

  const {
    game,
    gameBoard,
    playerBoard,
    participants,
    submissions,
    isLoading,
    error,
    isUploading,
    refreshParticipants,
    refreshSubmissions,
    setIsUploading,
  } = useGameData(gameId);

  const { submissionError, handleUploadComplete, handleUploadStart } =
    useImageSubmission(refreshParticipants, refreshSubmissions, setIsUploading);

  // Get latest submission for result display
  const latestSubmission = 0 < submissions.length ? submissions[0] : null;

  // Convert player board cell states to bingo board format
  const rawCellStates = playerBoard?.cellStates || {};
  const cellStates: Record<string, BingoCellState> = {};

  // Convert cell states to BingoCellState format
  for (const [cellId, state] of Object.entries(rawCellStates)) {
    cellStates[cellId] = state.isOpen ? "OPEN" : "CLOSE";
  }

  const completedLines = playerBoard?.completedLines || [];

  // Convert completed lines to cell indices for BingoBoard component
  const completedCellIndices = completedLines.map((line) => {
    // Convert line information to cell indices based on line type
    const indices: number[] = [];

    if (line.type === "row") {
      for (let x = 0; x < 5; x++) {
        indices.push(line.index * 5 + x);
      }
    } else if (line.type === "column") {
      for (let y = 0; y < 5; y++) {
        indices.push(y * 5 + line.index);
      }
    } else if (line.type === "diagonal") {
      if (line.index === 0) {
        // Main diagonal (top-left to bottom-right)
        for (let i = 0; i < 5; i++) {
          indices.push(i * 5 + i);
        }
      } else {
        // Anti-diagonal (top-right to bottom-left)
        for (let i = 0; i < 5; i++) {
          indices.push(i * 5 + (4 - i));
        }
      }
    }

    return indices;
  });

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="container mx-auto p-4">
          <div className="text-center">
            <p className="text-muted-foreground">{t("loading")}</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="container mx-auto p-4">
          <ErrorDisplay error={error} />
        </div>
      </AuthGuard>
    );
  }

  if (!game) {
    return (
      <AuthGuard>
        <div className="container mx-auto p-4">
          <ErrorDisplay error={t("gameNotFound")} />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto space-y-6 p-4">
        {/* 1. Game Title */}
        <GameHeader game={game} />

        {/* 2. User's Bingo Board */}
        <Card>
          <CardHeader>
            <CardTitle>{t("yourBoard")}</CardTitle>
          </CardHeader>
          <CardContent>
            <BingoBoard
              cells={gameBoard || []}
              cellStates={cellStates as Record<string, BingoCellState>}
              completedLines={completedCellIndices}
              className="mx-auto max-w-md"
            />
          </CardContent>
        </Card>

        {/* 3. Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle>{t("uploadImage")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              gameId={gameId}
              onUploadStart={handleUploadStart}
              onUploadComplete={handleUploadComplete}
              isUploading={isUploading}
            />
            <ErrorDisplay error={submissionError} className="mt-4" />
          </CardContent>
        </Card>

        {/* 4. Submission Result */}
        {latestSubmission && (
          <Card>
            <CardHeader>
              <CardTitle>{t("latestResult")}</CardTitle>
            </CardHeader>
            <CardContent>
              <SubmissionResult
                confidence={latestSubmission.confidence || 0}
                critique={latestSubmission.critique || ""}
                acceptanceStatus={
                  latestSubmission.acceptanceStatus || AcceptanceStatus.NO_MATCH
                }
                matchedCellId={latestSubmission.matchedCellId}
                confidenceThreshold={game.confidenceThreshold}
                imageUrl={latestSubmission.imageUrl}
              />
            </CardContent>
          </Card>
        )}

        {/* 5. Game Info */}
        <GameInfo game={game} />

        {/* 6. Participants List */}
        <ParticipantsList
          participants={participants}
          currentUserId={user?.id || ""}
        />
      </div>
    </AuthGuard>
  );
}
