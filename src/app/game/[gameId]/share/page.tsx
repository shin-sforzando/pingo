"use client";

import { BingoBoard } from "@/components/game/BingoBoard";
import { InfoCard } from "@/components/game/InfoCard";
import { QRCodeCard } from "@/components/game/QRCodeCard";
import { HyperText } from "@/components/magicui/hyper-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BASE_URL } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { GameStatus } from "@/types/common";
import type { Game, GameBoard } from "@/types/schema";
import {
  ActivityIcon,
  CalendarIcon,
  PercentIcon,
  PlayIcon,
  TableIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SharePage() {
  const params = useParams();
  const gameId = params.gameId as string;

  const t = useTranslations("Game.Share");

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
        const gameData = await gameResponse.json();
        setGame(gameData);

        // Fetch board data
        const boardResponse = await fetch(`/api/game/${gameId}/board`);
        if (boardResponse.ok) {
          const boardData = await boardResponse.json();
          setBoard(boardData);
        }

        // Fetch participants
        const participantsResponse = await fetch(
          `/api/game/${gameId}/participants`,
        );
        if (participantsResponse.ok) {
          const participantsData = await participantsResponse.json();
          setParticipants(participantsData);
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
        <h1 className="text-center font-bold text-2xl">{t("gameNotFound")}</h1>
        <p className="text-center text-muted-foreground">
          {t("gameNotFoundDesc")}
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
    [GameStatus.ACTIVE]: t("active"),
    [GameStatus.ENDED]: t("ended"),
    [GameStatus.ARCHIVED]: t("archived"),
  };

  return (
    <div className="container mx-auto py-8">
      {/* Game information header */}
      <div className="mb-8">
        <h1 className="text-center font-bold text-2xl">{game.title}</h1>
        <p className="text-center text-muted-foreground">{game.theme}</p>
        <div className="mt-4 flex justify-center gap-4">
          <Badge variant={game.isPublic ? "default" : "destructive"}>
            {game.isPublic ? t("public") : t("private")}
          </Badge>
          <Badge
            variant={game.isPhotoSharingEnabled ? "default" : "destructive"}
          >
            {t("photoSharing")}:{" "}
            {game.isPhotoSharingEnabled ? t("on") : t("off")}
          </Badge>
        </div>
      </div>

      {/* Join game button */}
      <div className="mb-6 flex justify-center">
        <Button variant="default" size="lg" className="gap-2" asChild>
          <Link href={`/game/${gameId}`}>
            <PlayIcon className="h-5 w-5" />
            {t("joinGame")}
          </Link>
        </Button>
      </div>

      {/* QR code (public games only) */}
      {game.isPublic && (
        <div className="mb-8">
          <QRCodeCard gameId={gameId} url={gameUrl} />
        </div>
      )}

      {/* Bingo board preview */}
      {board && (
        <div className="mb-8">
          <h2 className="mb-4 text-center font-semibold text-xl">
            {t("bingoBoard")}
          </h2>
          <BingoBoard cells={board.cells} />
        </div>
      )}

      {/* Game settings information */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <InfoCard
          title={t("expirationDate")}
          value={formatDate(game.expiresAt)}
          icon={<CalendarIcon className="h-4 w-4" />}
        />
        <InfoCard
          title={t("requiredBingoLines")}
          value={`${game.requiredBingoLines} ${t("lines")}`}
          icon={<TableIcon className="h-4 w-4" />}
        />
        <InfoCard
          title={t("confidenceThreshold")}
          value={`${Math.round(game.confidenceThreshold * 100)}%`}
          icon={<PercentIcon className="h-4 w-4" />}
        />
        <InfoCard
          title={t("status")}
          value={gameStatusMap[game.status]}
          icon={<ActivityIcon className="h-4 w-4" />}
        />
      </div>

      {/* Game notes (if any) */}
      {game.notes && (
        <div className="mb-6 rounded-lg bg-muted p-4">
          <h2 className="mb-2 font-semibold">{t("notes")}</h2>
          <p>{game.notes}</p>
        </div>
      )}

      {/* Participants list */}
      {0 < participants.length && (
        <div className="mt-8">
          <h2 className="mb-4 font-semibold text-xl">{t("participants")}</h2>
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

      {/* Join game button */}
      <div className="mb-6 flex justify-center">
        <Button variant="default" size="lg" className="gap-2" asChild>
          <Link href={`/game/${gameId}`}>
            <PlayIcon className="h-5 w-5" />
            {t("joinGame")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
