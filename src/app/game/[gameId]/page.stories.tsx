import { fakerJA as faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { AuthContext } from "@/contexts/AuthContext";
import { AcceptanceStatus, GameStatus } from "@/types/common";
import type { Cell } from "@/types/schema";
import GamePage from "./page";

// Generate sample cells for a 5x5 board
const generateSampleCells = (): Cell[] => {
  const cells: Cell[] = [];
  const subjects = [
    "赤い自転車",
    "青いポスト",
    "黄色い消火栓",
    "緑の公園のベンチ",
    "白い教会の尖塔",
    "黒い猫",
    "茶色い犬",
    "紫の花",
    "オレンジ色の看板",
    "ピンクの傘",
    "銀色の車",
    "金色の時計",
    "虹",
    "富士山",
    "東京タワー",
    "スカイツリー",
    "桜の木",
    "紅葉",
    "海",
    "川",
    "山",
    "田んぼ",
    "畑",
    "森",
  ];

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

// Mock authenticated user
const mockUser = {
  id: faker.string.ulid(),
  username: faker.person.fullName(),
  createdAt: new Date(),
  lastLoginAt: new Date(),
  participatingGames: ["GAME01"],
  gameHistory: [],
  isTestUser: true,
};

// Mock game data
const mockGame = {
  id: "GAME01",
  title: "夏休みビンゴ",
  theme: "宿題",
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  creatorId: faker.string.ulid(),
  isPublic: true,
  isPhotoSharingEnabled: true,
  requiredBingoLines: 3,
  confidenceThreshold: 0.7,
  maxSubmissionsPerUser: 30,
  status: GameStatus.ACTIVE,
  notes: "これは夏休みの宿題ビンゴです。",
};

const mockBoard = generateSampleCells();

// Include the mock user in participants list
const mockParticipants = [
  {
    id: mockUser.id,
    username: mockUser.username,
  },
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `user${i + 1}`,
    username: faker.person.fullName(),
  })),
];

const mockPlayerBoard = {
  cellStates: {},
  completedLines: [],
};

const mockSubmissions = [
  {
    id: "submission-1",
    createdAt: new Date().toISOString(),
    imageUrl: "https://via.placeholder.com/400",
    confidence: 0.85,
    critique: "写真に赤い自転車がはっきりと写っています。",
    acceptanceStatus: AcceptanceStatus.ACCEPTED,
    matchedCellId: "cell-0",
  },
];

// Note: Mocking next/navigation in Storybook is handled via parameters below

// Mock Firebase auth module
import { auth } from "@/lib/firebase/client";

// @ts-expect-error - Mock currentUser with all required properties for Firestore
auth.currentUser = {
  uid: mockUser.id,
  getIdToken: async () => "mock-id-token",
  _startProactiveRefresh: () => {},
  _stopProactiveRefresh: () => {},
  stsTokenManager: {
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    expirationTime: Date.now() + 3600000,
  },
};

// Mock fetch for API calls
const originalFetch = global.fetch;
global.fetch = ((url: string | URL | Request, init?: RequestInit) => {
  const urlString = url.toString();
  console.log(`Mocked fetch: ${urlString}`);

  // Mock game info API (exact match, not sub-paths like /board or /participants)
  if (urlString.match(/\/api\/game\/GAME01$/)) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        success: true,
        data: mockGame,
      }),
    } as Response);
  }

  // Mock board API
  if (urlString.includes("/api/game/GAME01/board")) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        success: true,
        data: mockBoard,
      }),
    } as Response);
  }

  // Mock participants API
  if (urlString.includes("/api/game/GAME01/participants")) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        success: true,
        data: mockParticipants,
      }),
    } as Response);
  }

  // Mock participation status API
  if (urlString.includes("/api/game/GAME01/participation")) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        success: true,
        data: { isParticipating: true },
      }),
    } as Response);
  }

  // Mock player board API
  if (urlString.includes("/api/game/GAME01/player-board")) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        success: true,
        data: mockPlayerBoard,
      }),
    } as Response);
  }

  // Mock player board API
  if (urlString.includes("/api/game/GAME01/playerBoard/")) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        success: true,
        data: mockPlayerBoard,
      }),
    } as Response);
  }

  // Mock submissions API (with query params)
  if (urlString.includes("/api/game/GAME01/submission")) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        success: true,
        data: mockSubmissions,
      }),
    } as Response);
  }

  // Default to original fetch
  return originalFetch(url as RequestInfo | URL, init);
}) as typeof fetch;

const meta = {
  title: "Pages/Game/Detail",
  component: GamePage,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/game/GAME01",
        query: {},
        segments: [["gameId", "GAME01"]],
      },
    },
  },
  decorators: [
    (Story) => (
      <AuthContext.Provider
        value={{
          user: mockUser,
          loading: false,
          error: null,
          login: async () => {},
          register: async () => {},
          logout: async () => {},
          updateUser: async () => {},
        }}
      >
        <Story />
      </AuthContext.Provider>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof GamePage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state - game page with user participating
 */
export const Default: Story = {};

/**
 * Game with recent submission result
 */
export const WithSubmission: Story = {};
