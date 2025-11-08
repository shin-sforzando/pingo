"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { BingoBoard } from "@/components/game/BingoBoard";
import { GameInfo } from "@/components/game/GameInfo";
import { ImageUpload } from "@/components/game/ImageUpload";
import { ParticipantsList } from "@/components/game/ParticipantsList";
import { SubmissionResult } from "@/components/game/SubmissionResult";
import { Confetti, type ConfettiRef } from "@/components/magicui/confetti";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useGameParticipation } from "@/hooks/useGameParticipation";
import { trackGameStarted } from "@/lib/analytics";
import { AcceptanceStatus } from "@/types/common";
import { ErrorDisplay } from "./components/ErrorDisplay";
import { GameHeader } from "./components/GameHeader";
import { useGameData } from "./hooks/useGameData";
import { useImageSubmission } from "./hooks/useImageSubmission";
import {
  convertCellStatesToBingoFormat,
  convertCompletedLinesToIndices,
  findMatchedCellSubject,
  getLatestSubmission,
} from "./utils/gameDataTransforms";

/**
 * Main game page component with refactored architecture
 * Displays complete game interface with confetti effects for celebrations
 */
export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const t = useTranslations();
  const { user } = useAuth();

  // Check participation status using custom hook
  const { isParticipating } = useGameParticipation(gameId, user);

  // Game data management
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

  // Confetti ref for celebrations
  const confettiRef = useRef<ConfettiRef>(null);

  // Track whether game started event has been sent
  const hasTrackedGameStart = useRef(false);

  // Image submission workflow
  const { submissionError, handleUploadComplete, handleUploadStart } =
    useImageSubmission({
      refreshParticipants,
      refreshSubmissions,
      setIsUploading,
      confettiRef,
    });

  // Transform data for UI components
  const latestSubmission = getLatestSubmission(submissions);
  const matchedCellSubject = findMatchedCellSubject(
    latestSubmission?.matchedCellId,
    gameBoard,
  );
  const cellStates = convertCellStatesToBingoFormat(
    playerBoard?.cellStates || {},
  );
  const completedCellIndices = convertCompletedLinesToIndices(
    playerBoard?.completedLines || [],
  );

  // Track game started event once when participating
  useEffect(() => {
    if (isParticipating === true && !hasTrackedGameStart.current) {
      trackGameStarted(gameId);
      hasTrackedGameStart.current = true;
    }
  }, [isParticipating, gameId]);

  // Redirect to share page if not participating (only after check completes)
  useEffect(() => {
    // Only redirect if user is logged in but not participating
    // Why: Prevents redirect to share page on logout, allowing AuthGuard to redirect to home
    if (user && isParticipating === false) {
      router.push(`/game/${gameId}/share`);
    }
  }, [user, isParticipating, gameId, router]);

  // Loading state or redirecting
  if (isLoading || isParticipating === null) {
    return (
      <AuthGuard>
        <div className="container mx-auto p-4">
          <div className="text-center">
            <p className="text-muted-foreground">{t("Game.loading")}</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Show redirect message while navigating
  if (isParticipating === false) {
    return (
      <AuthGuard>
        <div className="container mx-auto p-4">
          <div className="text-center">
            <p className="text-muted-foreground">
              {t("Game.redirectingToSharePage")}
            </p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Error state or game not found
  if (error || !game) {
    return (
      <AuthGuard>
        <div className="container mx-auto p-4">
          <Card className="mx-auto max-w-md">
            <CardHeader>
              <CardTitle>{t("Game.errors.gameNotFound")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {t("Game.errors.gameNotFoundDescription", { gameId })}
              </p>
              <Button
                className="w-full"
                onClick={() => router.push("/game/join")}
              >
                {t("Game.goToJoinPage")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto space-y-6 p-4">
        {/* Confetti canvas for celebrations */}
        <Confetti
          ref={confettiRef}
          className="pointer-events-none fixed inset-0 z-50"
          manualstart
        />

        {/* Game title and theme */}
        <GameHeader game={game} />

        {/* User's bingo board */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Game.yourBoard")}</CardTitle>
          </CardHeader>
          <CardContent>
            <BingoBoard
              cells={playerBoard?.cells || gameBoard || []}
              cellStates={cellStates}
              completedLines={completedCellIndices}
              className="mx-auto max-w-md"
            />
          </CardContent>
        </Card>

        {/* Image upload interface */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Game.uploadImage")}</CardTitle>
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

        {/* Latest submission result */}
        {latestSubmission && (
          <Card>
            <CardHeader>
              <CardTitle>{t("Game.latestResult")}</CardTitle>
            </CardHeader>
            <CardContent>
              <SubmissionResult
                confidence={latestSubmission.confidence || 0}
                critique_ja={latestSubmission.critique_ja || ""}
                critique_en={latestSubmission.critique_en || ""}
                acceptanceStatus={
                  latestSubmission.acceptanceStatus || AcceptanceStatus.NO_MATCH
                }
                matchedCellSubject={matchedCellSubject}
                confidenceThreshold={game.confidenceThreshold}
                imageUrl={latestSubmission.imageUrl}
              />
            </CardContent>
          </Card>
        )}

        {/* Game information */}
        <GameInfo game={game} />

        {/* Participants list */}
        <ParticipantsList
          participants={participants}
          currentUserId={user?.id || ""}
        />
      </div>
    </AuthGuard>
  );
}
