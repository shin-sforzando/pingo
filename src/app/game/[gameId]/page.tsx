"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
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
import { auth } from "@/lib/firebase/client";
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
  const [isParticipating, setIsParticipating] = useState<boolean | null>(null);

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

  // Check participation status
  useEffect(() => {
    if (user) {
      // If game failed to load, check if user is participating by gameId
      if (error && !game) {
        const checkParticipation =
          user.participatingGames?.includes(gameId) || false;
        setIsParticipating(checkParticipation);
      } else if (game) {
        // Check if user is participating
        const checkParticipation =
          user.participatingGames?.includes(game.id) || false;
        setIsParticipating(checkParticipation);
      }
    }
  }, [user, game, error, gameId]);

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

  // Show join prompt if not participating and game exists
  if (isParticipating === false && !error && game) {
    return (
      <AuthGuard>
        <div className="container mx-auto p-4">
          <Card className="mx-auto max-w-md">
            <CardHeader>
              <CardTitle>{t("joinGameTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("title")}</p>
                  <p className="font-semibold">{game.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("theme")}</p>
                  <p>{game.theme}</p>
                </div>
                <Button
                  className="w-full"
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/game/${gameId}/join`, {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
                        },
                      });
                      if (response.ok) {
                        router.refresh();
                      }
                    } catch (error) {
                      console.error("Failed to join game:", error);
                    }
                  }}
                >
                  {t("joinGameButton")}
                </Button>
              </div>
            </CardContent>
          </Card>
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
                {t("Game.goToJoinPage")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  // Already handled above, but TypeScript needs this
  if (isParticipating === false) {
    router.push(`/game/join?gameId=${gameId}`);
    return (
      <AuthGuard>
        <div className="container mx-auto p-4">
          <div className="text-center">
            <p>{t("Game.redirectingToJoinPage")}</p>
          </div>
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
