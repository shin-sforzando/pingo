import { BingoBoard } from "@/components/game/BingoBoard";
import { InfoCard } from "@/components/game/InfoCard";
import { QRCodeCard } from "@/components/game/QRCodeCard";
import { Badge } from "@/components/ui/badge";
import { BASE_URL } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { getGameBoard, getGameData, getParticipants } from "@/services/game";
import { GameStatus } from "@/types/common";
import {
  ActivityIcon,
  CalendarIcon,
  PercentIcon,
  TableIcon,
} from "lucide-react";
import { headers } from "next/headers";

interface SharePageProps {
  params: Promise<{
    gameId: string;
  }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { gameId } = await params;
  const game = await getGameData(gameId);

  if (!game) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-center font-bold text-2xl">Game not found</h1>
        <p className="text-center text-muted-foreground">
          The game you are looking for does not exist or has been deleted.
        </p>
      </div>
    );
  }

  const board = await getGameBoard(gameId);
  const participants = await getParticipants(gameId);

  // Get the current URL for QR code
  const headersList = await headers();
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const host = headersList.get("host") || new URL(BASE_URL).host;
  const gameUrl = `${protocol}://${host}/game/${gameId}`;

  // Format game status for display
  const gameStatusMap: Record<GameStatus, string> = {
    [GameStatus.ACTIVE]: "Active",
    [GameStatus.ENDED]: "Ended",
    [GameStatus.ARCHIVED]: "Archived",
  };

  return (
    <div className="container mx-auto py-8">
      {/* Game information header */}
      <div className="mb-8">
        <h1 className="text-center font-bold text-2xl">{game.title}</h1>
        <p className="text-center text-muted-foreground">{game.theme}</p>
        <div className="mt-4 flex justify-center gap-4">
          <Badge variant={game.isPublic ? "default" : "destructive"}>
            {game.isPublic ? "Public" : "Private"}
          </Badge>
          <Badge
            variant={game.isPhotoSharingEnabled ? "default" : "destructive"}
          >
            Photo Sharing: {game.isPhotoSharingEnabled ? "ON" : "OFF"}
          </Badge>
        </div>
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
            Bingo Board
          </h2>
          <BingoBoard cells={board.cells} />
        </div>
      )}

      {/* Game settings information */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <InfoCard
          title="Expiration Date"
          value={formatDate(game.expiresAt)}
          icon={<CalendarIcon className="h-4 w-4" />}
        />
        <InfoCard
          title="Required Bingo Lines"
          value={`${game.requiredBingoLines} lines`}
          icon={<TableIcon className="h-4 w-4" />}
        />
        <InfoCard
          title="Confidence Threshold"
          value={`${Math.round(game.confidenceThreshold * 100)}%`}
          icon={<PercentIcon className="h-4 w-4" />}
        />
        <InfoCard
          title="Status"
          value={gameStatusMap[game.status]}
          icon={<ActivityIcon className="h-4 w-4" />}
        />
      </div>

      {/* Game notes (if any) */}
      {game.notes && (
        <div className="mb-6 rounded-lg bg-muted p-4">
          <h2 className="mb-2 font-semibold">Notes</h2>
          <p>{game.notes}</p>
        </div>
      )}

      {/* Participants list */}
      {participants.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 font-semibold text-xl">Participants</h2>
          <div className="grid grid-cols-2 gap-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="truncate rounded-lg border p-2"
              >
                {participant.username}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
