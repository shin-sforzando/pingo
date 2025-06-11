"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { BingoBoard } from "@/components/game/BingoBoard";
import { GameInfo } from "@/components/game/GameInfo";
import { ImageUpload } from "@/components/game/ImageUpload";
import { ParticipantsList } from "@/components/game/ParticipantsList";
import { SubmissionResult } from "@/components/game/SubmissionResult";
import { Confetti } from "@/components/magicui/confetti";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { AcceptanceStatus } from "@/types/common";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { ErrorDisplay } from "./components/ErrorDisplay";
import { GameHeader } from "./components/GameHeader";
import { useConfettiEffects } from "./hooks/useConfettiEffects";
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
  const gameId = params.gameId as string;
  const t = useTranslations("Game");
  const { user } = useAuth();

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

  // Image submission workflow
  const { submissionError, handleUploadComplete, handleUploadStart } =
    useImageSubmission({
      refreshParticipants,
      refreshSubmissions,
      setIsUploading,
    });

  // Confetti effects for celebrations
  const confettiRef = useConfettiEffects({
    completedLines: playerBoard?.completedLines || [],
    requiredBingoLines: game?.requiredBingoLines || 1,
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

  // Loading state
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

  // Error state
  if (error) {
    return (
      <AuthGuard>
        <div className="container mx-auto p-4">
          <ErrorDisplay error={error} />
        </div>
      </AuthGuard>
    );
  }

  // Game not found state
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
