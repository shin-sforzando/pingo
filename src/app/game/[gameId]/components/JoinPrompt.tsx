"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/firebase/client";
import type { Game } from "@/types/schema";

interface JoinPromptProps {
  game: Game;
  onJoinSuccess: () => void;
}

/**
 * Component to prompt user to join a game when they access it directly
 */
export function JoinPrompt({ game, onJoinSuccess }: JoinPromptProps) {
  const t = useTranslations("Game");
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleJoin = async () => {
    setIsJoining(true);
    setJoinError(null);

    try {
      // Get auth token
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error(t("errors.joinFailed"));
      }

      // Join the game
      const response = await fetch(`/api/game/${game.id}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || t("errors.joinFailed"));
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.error?.message || t("errors.joinFailed"));
      }

      // Success - reload the page to show game content
      onJoinSuccess();
    } catch (error) {
      console.error("Error joining game:", error);
      setJoinError(
        error instanceof Error ? error.message : t("errors.joinFailed"),
      );
    } finally {
      setIsJoining(false);
    }
  };

  // Check if game has expired
  const isExpired = game.expiresAt && new Date(game.expiresAt) < new Date();

  return (
    <div className="container mx-auto max-w-2xl py-6">
      <Card>
        <CardHeader>
          <CardTitle>{game.title}</CardTitle>
          <CardDescription>{game.theme}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isExpired ? (
            <>
              <p className="text-destructive">{t("errors.gameExpired")}</p>
              <Button
                onClick={() => router.push("/game/join")}
                variant="outline"
              >
                {t("joinGame")}
              </Button>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">{t("Share.joinGame")}</p>

              {/* Game info */}
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">
                    {t("requiredBingoLines")}:
                  </span>{" "}
                  {game.requiredBingoLines} {t("Share.lines")}
                </div>
                <div>
                  <span className="font-semibold">
                    {t("confidenceThreshold")}:
                  </span>{" "}
                  {Math.round(game.confidenceThreshold * 100)}%
                </div>
                <div>
                  <span className="font-semibold">
                    {t("isPhotoSharingEnabled")}:
                  </span>{" "}
                  {game.isPhotoSharingEnabled ? t("Share.on") : t("Share.off")}
                </div>
                {game.notes && (
                  <div>
                    <span className="font-semibold">{t("notes")}:</span>{" "}
                    {game.notes}
                  </div>
                )}
              </div>

              <Button
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full"
                size="lg"
              >
                {isJoining ? t("joining") : t("join")}
              </Button>

              {joinError && (
                <p className="text-destructive text-sm text-center">
                  {joinError}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
