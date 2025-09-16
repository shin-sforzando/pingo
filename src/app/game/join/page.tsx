"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TranslatedFormMessage } from "@/components/ui/translated-form-message";
import { auth } from "@/lib/firebase/client";
import type { Game } from "@/types/schema";

// Form validation schema
const joinGameSchema = z.object({
  gameId: z
    .string()
    .min(6, "Game ID must be 6 characters")
    .max(6, "Game ID must be 6 characters")
    .regex(/^[A-Z0-9]{6}$/, "Game ID must be 6 uppercase letters or numbers"),
});

type JoinGameFormValues = z.infer<typeof joinGameSchema>;

/**
 * Game join page component
 */
export default function JoinGamePage() {
  const t = useTranslations();
  const router = useRouter();

  // State for game verification
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedGame, setVerifiedGame] = useState<Pick<
    Game,
    "id" | "title" | "theme" | "expiresAt"
  > | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  );

  // State for joining game
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Form setup
  const form = useForm<JoinGameFormValues>({
    resolver: zodResolver(joinGameSchema),
    mode: "onChange",
    defaultValues: {
      gameId: "",
    },
  });

  // Watch the gameId field for changes
  const gameId = form.watch("gameId");

  /**
   * Handle game ID input change - convert to uppercase
   */
  const handleGameIdChange = (value: string) => {
    const upperValue = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);
    form.setValue("gameId", upperValue);

    // Clear verification state when input changes
    if (verifiedGame && verifiedGame.id !== upperValue) {
      setVerifiedGame(null);
      setVerificationError(null);
    }
  };

  /**
   * Verify game exists and is joinable
   */
  const verifyGame = async () => {
    const gameIdValue = form.getValues("gameId");

    if (!gameIdValue || gameIdValue.length !== 6) {
      setVerificationError(t("Game.errors.invalidGameId"));
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);

    try {
      // Get auth token
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error(t("Common.notAuthenticated"));
      }

      // Verify game exists
      const response = await fetch(`/api/game/${gameIdValue}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(t("Game.errors.gameNotFound"));
        }
        throw new Error(t("Game.errors.verificationFailed"));
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error(t("Game.errors.gameNotFound"));
      }

      const game = data.data;

      // Check if game has expired
      if (game.expiresAt && new Date(game.expiresAt) < new Date()) {
        throw new Error(t("Game.errors.gameExpired"));
      }

      // Store verified game info
      setVerifiedGame({
        id: game.id,
        title: game.title,
        theme: game.theme,
        expiresAt: game.expiresAt,
      });
    } catch (error) {
      console.error("Error verifying game:", error);
      setVerificationError(
        error instanceof Error
          ? error.message
          : t("Game.errors.verificationFailed"),
      );
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Handle form submission - join the game
   */
  const onSubmit: SubmitHandler<JoinGameFormValues> = async (data) => {
    // Verify game first if not already verified
    if (!verifiedGame || verifiedGame.id !== data.gameId) {
      await verifyGame();
      if (!verifiedGame) {
        return;
      }
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      // Get auth token
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error(t("Common.notAuthenticated"));
      }

      // Join the game
      const response = await fetch(`/api/game/${data.gameId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || t("Game.errors.joinFailed"),
        );
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(
          responseData.error?.message || t("Game.errors.joinFailed"),
        );
      }

      // Redirect to game page
      router.push(`/game/${data.gameId}`);
    } catch (error) {
      console.error("Error joining game:", error);
      setJoinError(
        error instanceof Error ? error.message : t("Game.errors.joinFailed"),
      );
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <AuthGuard>
      <div className="container mx-auto max-w-2xl space-y-8 py-6">
        <div>
          <h1 className="font-bold text-3xl">{t("Game.joinGame")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("Game.joinGameDescription")}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("Game.enterGameId")}</CardTitle>
                <CardDescription>
                  {t("Game.enterGameIdDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="gameId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Game.gameId")}</FormLabel>
                      <FormDescription>
                        {t("Game.gameIdDescription")}
                      </FormDescription>
                      <FormControl>
                        <div className="flex space-x-2">
                          <Input
                            {...field}
                            placeholder="ABC123"
                            maxLength={6}
                            className="font-mono text-2xl text-center uppercase"
                            onChange={(e) => handleGameIdChange(e.target.value)}
                            autoComplete="off"
                            autoCapitalize="characters"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={verifyGame}
                            disabled={gameId.length !== 6 || isVerifying}
                          >
                            {isVerifying
                              ? t("Common.verifying")
                              : t("Common.verify")}
                          </Button>
                        </div>
                      </FormControl>
                      <TranslatedFormMessage />
                      {verificationError && (
                        <p className="text-destructive text-sm">
                          {verificationError}
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Show game info after verification */}
            {verifiedGame && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle>{t("Game.gameFound")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-semibold">{t("Game.title")}:</span>{" "}
                    {verifiedGame.title}
                  </div>
                  <div>
                    <span className="font-semibold">{t("Game.theme")}:</span>{" "}
                    {verifiedGame.theme}
                  </div>
                  {verifiedGame.expiresAt && (
                    <div>
                      <span className="font-semibold">
                        {t("Game.expiresAt")}:
                      </span>{" "}
                      {new Date(verifiedGame.expiresAt).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={!verifiedGame || isJoining}
            >
              {isJoining ? t("Game.joining") : t("Game.join")}
            </Button>

            {joinError && (
              <p className="text-destructive text-sm text-center">
                {joinError}
              </p>
            )}
          </form>
        </Form>

        {/* Additional help text */}
        <div className="rounded-lg bg-muted p-4">
          <p className="text-muted-foreground text-sm">
            {t("Game.joinHelpText")}
          </p>
        </div>
      </div>
    </AuthGuard>
  );
}
