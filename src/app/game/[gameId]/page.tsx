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
  const t = useTranslations("Game");
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

  // Redirect to share page if not participating (only after check completes)
  useEffect(() => {
    // Only redirect if participation check has completed (not null) and user is not participating
    if (isParticipating === false && isParticipating !== null) {
      router.push(`/game/${gameId}/share`);
    }
  }, [isParticipating, gameId, router]);

  // Loading state or redirecting
  if (isLoading || isParticipating === null) {
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

  // Show redirect message while navigating
  if (isParticipating === false) {
    return (
      <AuthGuard>
        <div className="container mx-auto p-4">
          <div className="text-center">
            <p className="text-muted-foreground">
              {t("redirectingToSharePage")}
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
              <CardTitle>{t("errors.gameNotFound")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {t("errors.gameNotFoundDescription", { gameId })}
              </p>
              <Button
                className="w-full"
                onClick={() => router.push("/game/join")}
              >
                {t("goToJoinPage")}
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
            <CardTitle>{t("yourBoard")}</CardTitle>
          </CardHeader>
          <CardContent>
            <BingoBoard
              cells={gameBoard || []}
              cellStates={cellStates}
              completedLines={completedCellIndices}
              className="mx-auto max-w-md"
            />
          </CardContent>
        </Card>

        {/* Image upload interface */}
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

        {/* Latest submission result */}
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
