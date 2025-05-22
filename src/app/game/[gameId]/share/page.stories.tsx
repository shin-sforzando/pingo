import { BingoBoard } from "@/components/game/BingoBoard";
import { InfoCard } from "@/components/game/InfoCard";
import { QRCodeCard } from "@/components/game/QRCodeCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { GameStatus } from "@/types/common";
import type { Cell, Game, GameBoard } from "@/types/schema";
import { fakerJA as faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/react";
import {
  ActivityIcon,
  CalendarIcon,
  PercentIcon,
  PlayIcon,
  TableIcon,
} from "lucide-react";
import { customAlphabet } from "nanoid";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

// Create a mock component that doesn't use React.use
// This is a special version of SharePage for Storybook
const MockSharePageComponent = ({ gameId }: { gameId: string }) => {
  // Mock the same state and behavior as the original component
  const [game, setGame] = useState<Game | null>(null);
  const [board, setBoard] = useState<GameBoard | null>(null);
  const [participants, setParticipants] = useState<
    Array<{ id: string; username: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error] = useState(false);
  const t = (key: string) => {
    const translations: Record<string, string> = {
      gameNotFound: "ゲームが見つかりません",
      gameNotFoundDesc:
        "探しているゲームは存在しないか、削除された可能性があります",
      bingoBoard: "ビンゴボード",
      expirationDate: "有効期限",
      requiredBingoLines: "必要なビンゴライン",
      confidenceThreshold: "信頼度しきい値",
      status: "ステータス",
      notes: "メモ",
      participants: "参加者",
      lines: "ライン",
      active: "アクティブ",
      ended: "終了",
      archived: "アーカイブ済み",
      public: "公開",
      private: "非公開",
      photoSharing: "写真共有",
      on: "オン",
      off: "オフ",
      joinGame: "このゲームに参加する",
    };
    return translations[key] || key;
  };

  // Mock game data
  const mockGame = useMemo<Game>(
    () => ({
      id: gameId,
      title: "夏休み",
      theme: "宿題",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      creatorId: faker.string.ulid(),
      isPublic: true,
      isPhotoSharingEnabled: true,
      requiredBingoLines: 3,
      confidenceThreshold: 0.7,
      status: GameStatus.ACTIVE,
      notes: "これは夏休みの宿題ビンゴです。",
    }),
    [gameId],
  );

  // Mock board data
  const mockBoard = useMemo(
    () => ({
      cells: generateSampleCells(),
    }),
    [],
  );

  // Mock participants data
  const mockParticipants = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        id: `user${i + 1}`,
        username: faker.person.fullName(),
      })),
    [],
  );

  useEffect(() => {
    setGame(mockGame);
    setBoard(mockBoard);
    setParticipants(mockParticipants);
    setLoading(false);
  }, [mockGame, mockBoard, mockParticipants]);

  // Get the current URL for QR code
  const gameUrl = `https://example.com/game/${gameId}`;

  // Format game status for display
  const gameStatusMap: Record<GameStatus, string> = {
    [GameStatus.ACTIVE]: t("active"),
    [GameStatus.ENDED]: t("ended"),
    [GameStatus.ARCHIVED]: t("archived"),
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Loading...</p>
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
};

// Mock component to wrap the page component
const MockSharePage = ({
  gameId,
  gameExists = true,
  isLoading = false,
}: {
  gameId: string;
  gameExists?: boolean;
  isLoading?: boolean;
}) => {
  // Mock game data
  const mockGame: Game = {
    id: gameId,
    title: "夏休み",
    theme: "宿題",
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    creatorId: faker.string.ulid(),
    isPublic: true,
    isPhotoSharingEnabled: true,
    requiredBingoLines: 3,
    confidenceThreshold: 0.7,
    status: GameStatus.ACTIVE,
    notes: "これは夏休みの宿題ビンゴです。",
  };

  // Mock board data
  const mockBoard = {
    cells: generateSampleCells(),
  };

  // Mock participants data
  const mockParticipants = Array.from({ length: 5 }, (_, i) => ({
    id: `user${i + 1}`,
    username: faker.person.fullName(),
  }));

  // Mock fetch responses for Storybook
  if (typeof window !== "undefined") {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const url = input.toString();
      console.log(`Mocked fetch: ${url}`);

      if (!gameExists) {
        return new Response(JSON.stringify({ error: "Game not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (isLoading) {
        return new Promise(() => {});
      }

      if (url.includes(`/api/game/${gameId}`)) {
        return new Response(JSON.stringify(mockGame), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes(`/api/game/${gameId}/board`)) {
        return new Response(JSON.stringify(mockBoard), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes(`/api/game/${gameId}/participants`)) {
        return new Response(JSON.stringify(mockParticipants), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Default to original fetch for other requests
      return originalFetch(input, init);
    };
  }

  return <MockSharePageComponent gameId={gameId} />;
};

// Generate sample cells for a 5x5 board
const generateSampleCells = (): Cell[] => {
  const cells: Cell[] = [];
  const subjects = faker.helpers.multiple(() => faker.lorem.word(), {
    count: 24,
  });

  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      const index = y * 5 + x;
      const isFree = index === 12; // Center cell is FREE

      cells.push({
        id: `cell-${index}`,
        position: { x, y },
        subject: isFree ? "FREE" : subjects[12 < index ? index - 1 : index],
        isFree,
      });
    }
  }

  return cells;
};

const meta = {
  title: "Pages/Game/Share",
  component: MockSharePage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    gameId: { control: "text" },
    gameExists: { control: "boolean" },
    isLoading: { control: "boolean" },
  },
} satisfies Meta<typeof MockSharePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    gameId: customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ")(6),
    gameExists: true,
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    gameId: customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ")(6),
    gameExists: true,
    isLoading: true,
  },
};

export const GameNotFound: Story = {
  args: {
    gameId: "NOT404",
    gameExists: false,
    isLoading: false,
  },
};
