"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { formatDistanceToNow } from "date-fns";
import { enUS, ja } from "date-fns/locale";
import { Calendar, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useGameJoin } from "@/hooks/useGameJoin";
import { useParticipatingGames } from "@/hooks/useParticipatingGames";
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
  const locale = useLocale();
  const { user } = useAuth();

  // State for game verification
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedGame, setVerifiedGame] = useState<Pick<
    Game,
    "id" | "title" | "theme" | "expiresAt"
  > | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  );

  // Use custom hook for game join functionality
  const { joinGame, isJoining, error: joinError } = useGameJoin();

  // Fetch participating games using custom hook
  const {
    participatingGames,
    isLoading: isLoadingParticipatingGames,
    error: participatingGamesError,
  } = useParticipatingGames(user, { fetchDetails: true });

  // State for available games (excluding already participating)
  const [availableGames, setAvailableGames] = useState<
    Array<{
      id: string;
      title: string;
      theme: string;
      notes?: string;
      participantCount: number;
      createdAt: Date | null;
      expiresAt: Date | null;
    }>
  >([]);
  const [isLoadingPublicGames, setIsLoadingPublicGames] = useState(true);

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

  // Log participating games error if any
  useEffect(() => {
    if (participatingGamesError) {
      console.error(
        "Error fetching participating games:",
        participatingGamesError,
      );
    }
  }, [participatingGamesError]);

  // Fetch available games (public games excluding those already participating)
  useEffect(() => {
    const fetchAvailableGames = async () => {
      // Wait for authentication to be ready
      if (!user) {
        return;
      }

      setIsLoadingPublicGames(true);
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const headers: HeadersInit = {};
        if (idToken) {
          headers.Authorization = `Bearer ${idToken}`;
        }

        const response = await fetch("/api/game/public", { headers });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.games) {
            // Filter out games that user is already participating in
            interface GameWithParticipation {
              id: string;
              title: string;
              theme: string;
              notes?: string;
              participantCount: number;
              isParticipating?: boolean;
              createdAt: Date | null;
              expiresAt: Date | null;
            }

            const notParticipating = data.data.games.filter(
              (game: GameWithParticipation) => game.isParticipating !== true,
            );

            setAvailableGames(notParticipating);
          }
        }
      } catch (error) {
        console.error("Failed to fetch available games:", error);
      } finally {
        setIsLoadingPublicGames(false);
      }
    };

    fetchAvailableGames();
  }, [user]);

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

    // Use the custom hook to join the game
    const result = await joinGame(data.gameId);

    if (result.success) {
      // Redirect to share page to show game details
      router.push(`/game/${data.gameId}/share`);
    }
    // Error handling is managed by the hook
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

        {/* Participating Games List */}
        {participatingGames.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("Game.participatingGames")}</CardTitle>
              <CardDescription>
                {isLoadingParticipatingGames
                  ? t("Game.loading")
                  : t("Game.participatingGamesDescription", {
                      count: participatingGames.length,
                    })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {participatingGames.map((game) => (
                  <Card
                    key={game.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => {
                      // Navigate to the game page directly
                      router.push(`/game/${game.id}`);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{game.title}</h4>
                            <span className="font-mono text-muted-foreground text-xs">
                              {game.id}
                            </span>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {game.theme}
                          </p>
                          {game.notes && (
                            <p className="mt-1 text-muted-foreground text-xs italic">
                              {game.notes}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-4 text-muted-foreground text-sm">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {game.participantCount}
                            </span>
                            {game.expiresAt && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDistanceToNow(new Date(game.expiresAt), {
                                  addSuffix: true,
                                  locale: locale === "ja" ? ja : enUS,
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Games List */}
        {availableGames.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("Game.availableGames")}</CardTitle>
              <CardDescription>
                {isLoadingPublicGames
                  ? t("Game.loading")
                  : t("Game.availableGamesDescription", {
                      count: availableGames.length,
                    })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {availableGames.map((game) => (
                  <Card
                    key={game.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={async () => {
                      // Set the form values and verified game
                      form.setValue("gameId", game.id);
                      setVerifiedGame({
                        id: game.id,
                        title: game.title,
                        theme: game.theme,
                        expiresAt: game.expiresAt as Date,
                      });

                      // Automatically join the game
                      await onSubmit({ gameId: game.id });
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{game.title}</h4>
                            <span className="font-mono text-muted-foreground text-xs">
                              {game.id}
                            </span>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {game.theme}
                          </p>
                          {game.notes && (
                            <p className="mt-1 text-muted-foreground text-xs italic">
                              {game.notes}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-4 text-muted-foreground text-sm">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {game.participantCount}
                            </span>
                            {game.expiresAt && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDistanceToNow(new Date(game.expiresAt), {
                                  addSuffix: true,
                                  locale: locale === "ja" ? ja : enUS,
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthGuard>
  );
}
