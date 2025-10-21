"use client";

import {
  ActivityIcon,
  CalendarIcon,
  PercentIcon,
  PlayIcon,
  TableIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { BingoBoard } from "@/components/game/BingoBoard";
import { InfoCard } from "@/components/game/InfoCard";
import { QRCodeCard } from "@/components/game/QRCodeCard";
import { HyperText } from "@/components/magicui/hyper-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useGameJoin } from "@/hooks/useGameJoin";
import { useGameParticipation } from "@/hooks/useGameParticipation";
import { BASE_URL } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { GameStatus } from "@/types/common";
import type { Game, GameBoard } from "@/types/schema";

export default function SharePage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const router = useRouter();

  const t = useTranslations();
  const { user } = useAuth();

  // Use custom hooks for participation and join functionality
  const { isParticipating } = useGameParticipation(gameId, user);
  const { joinGame, isJoining } = useGameJoin();

  const [game, setGame] = useState<Game | null>(null);
  const [board, setBoard] = useState<GameBoard | null>(null);
  const [participants, setParticipants] = useState<
    Array<{ id: string; username: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch game data
        const gameResponse = await fetch(`/api/game/${gameId}`);
        if (!gameResponse.ok) {
          setError(true);
          return;
        }
        const gameResult = await gameResponse.json();
        if (gameResult.success) {
          setGame(gameResult.data);
        } else {
          setError(true);
          return;
        }

        // Fetch board data
        const boardResponse = await fetch(`/api/game/${gameId}/board`);
        if (boardResponse.ok) {
          const boardResult = await boardResponse.json();
          if (boardResult.success) {
            setBoard(boardResult.data);
          }
        }

        // Fetch participants
        const participantsResponse = await fetch(
          `/api/game/${gameId}/participants`,
        );
        if (participantsResponse.ok) {
          const participantsResult = await participantsResponse.json();
          if (participantsResult.success) {
            setParticipants(participantsResult.data);
          }
        }
      } catch (err) {
        console.error("Error fetching game data:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [gameId]);

  // Handle join button click using the custom hook
  const handleJoinClick = async () => {
    // Check if user is logged in before allowing join/play
    if (!user) {
      // Redirect to login page with return URL
      router.push(`/?redirect=${encodeURIComponent(`/game/${gameId}/share`)}`);
      return;
    }

    if (isParticipating) {
      // Already participating, just navigate to game page
      router.push(`/game/${gameId}`);
      return;
    }

    // Not participating yet, join the game first
    const result = await joinGame(gameId);

    if (result.success || result.data?.alreadyParticipating) {
      // Successfully joined or already participating, navigate to game page
      router.push(`/game/${gameId}`);
    } else {
      // Join failed, but still try to navigate (user might already be joined)
      console.error("Error joining game:", result.error);
      router.push(`/game/${gameId}`);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto flex min-h-[50vh] items-center justify-center py-8">
        <HyperText
          className="text-center font-bold text-4xl md:text-6xl"
          duration={1200}
        >
          Loading...
        </HyperText>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-center font-bold text-2xl">
          {t("Game.Share.gameNotFound")}
        </h1>
        <p className="text-center text-muted-foreground">
          {t("Game.Share.gameNotFoundDesc")}
        </p>
      </div>
    );
  }

  // Get the current URL for QR code
  const gameUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/game/${gameId}`
      : `${BASE_URL}/game/${gameId}`;

  // Format game status for display
  const gameStatusMap: Record<GameStatus, string> = {
    [GameStatus.ACTIVE]: t("Game.active"),
    [GameStatus.ENDED]: t("Game.ended"),
    [GameStatus.ARCHIVED]: t("Game.archived"),
  };

  return (
    <div className="container mx-auto py-8">
      {/* Game information header */}
      <div className="mb-8">
        <h1 className="text-center font-bold text-2xl">{game.title}</h1>
        <p className="text-center text-muted-foreground">{game.theme}</p>
        <div className="mt-4 flex justify-center gap-4">
          <Badge variant={game.isPublic ? "default" : "destructive"}>
            {game.isPublic ? t("Game.public") : t("Game.private")}
          </Badge>
          <Badge
            variant={game.isPhotoSharingEnabled ? "default" : "destructive"}
          >
            {t("Game.photoSharing")}:{" "}
            {game.isPhotoSharingEnabled ? t("Game.on") : t("Game.off")}
          </Badge>
        </div>
      </div>

      {/* Play/Join game button */}
      <div className="mb-6 flex justify-center">
        <Button
          variant="default"
          size="lg"
          className="gap-2"
          onClick={handleJoinClick}
          disabled={isJoining}
        >
          <PlayIcon className="h-5 w-5" />
          {isJoining
            ? "Joining..."
            : isParticipating
              ? t("Game.Share.playGame")
              : t("Game.Share.joinGame")}
        </Button>
      </div>

      {/* QR code (public games only) or Game ID (private games) */}
      <div className="mb-8">
        {game.isPublic ? (
          <QRCodeCard gameId={gameId} url={gameUrl} />
        ) : (
          <div className="mx-auto w-full max-w-md rounded-lg border p-6 text-center">
            <p className="font-mono font-semibold text-3xl">
              Game ID: {gameId}
            </p>
          </div>
        )}
      </div>

      {/* Bingo board preview */}
      {board && (
        <div className="mb-8">
          <h2 className="mb-4 text-center font-semibold text-xl">
            {t("Game.Share.bingoBoard")}
          </h2>
          <BingoBoard cells={board.cells} />
        </div>
      )}

      {/* Game settings information */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <InfoCard
          title={t("Game.expirationDate")}
          value={formatDate(game.expiresAt)}
          icon={<CalendarIcon className="h-4 w-4" />}
        />
        <InfoCard
          title={t("Game.requiredBingoLines")}
          value={`${game.requiredBingoLines} ${t("Game.lines")}`}
          icon={<TableIcon className="h-4 w-4" />}
        />
        <InfoCard
          title={t("Game.confidenceThreshold")}
          value={`${Math.round(game.confidenceThreshold * 100)}%`}
          icon={<PercentIcon className="h-4 w-4" />}
        />
        <InfoCard
          title={t("Game.status")}
          value={gameStatusMap[game.status]}
          icon={<ActivityIcon className="h-4 w-4" />}
        />
      </div>

      {/* Game notes (if any) */}
      {game.notes && (
        <div className="mb-6 rounded-lg bg-muted p-4">
          <h2 className="mb-2 font-semibold">{t("Game.notes")}</h2>
          <p>{game.notes}</p>
        </div>
      )}

      {/* Participants list */}
      {0 < participants.length && (
        <div className="mt-8">
          <h2 className="mb-4 font-semibold text-xl">
            {t("Game.Share.participants")}
          </h2>
          <ul className="list-inside list-disc space-y-2 pl-5">
            {participants.map((participant) => (
              <li
                key={participant.id}
                className="truncate rounded-lg border p-2"
              >
                {participant.username}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Play/Join game button */}
      <div className="mb-6 flex justify-center">
        <Button
          variant="default"
          size="lg"
          className="gap-2"
          onClick={handleJoinClick}
          disabled={isJoining}
        >
          <PlayIcon className="h-5 w-5" />
          {isJoining
            ? "Joining..."
            : isParticipating
              ? t("Game.Share.playGame")
              : t("Game.Share.joinGame")}
        </Button>
      </div>
    </div>
  );
}
