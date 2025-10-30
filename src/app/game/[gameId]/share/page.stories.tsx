import { fakerJA as faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { BOARD_SIZE, CENTER_CELL_INDEX, NON_FREE_CELLS } from "@/lib/constants";
import { GameStatus } from "@/types/common";
import type { Cell, Game } from "@/types/schema";
import SharePage from "./page";

// Generate sample cells for a BOARD_SIZE x BOARD_SIZE board
const generateSampleCells = (): Cell[] => {
  const cells: Cell[] = [];
  const subjects = faker.helpers.multiple(() => faker.lorem.word(), {
    count: NON_FREE_CELLS,
  });

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const index = y * BOARD_SIZE + x;
      const isFree = index === CENTER_CELL_INDEX; // Center cell is FREE

      cells.push({
        id: `cell_${index}`,
        position: { x, y },
        subject: isFree
          ? "FREE"
          : subjects[CENTER_CELL_INDEX < index ? index - 1 : index],
        isFree,
      });
    }
  }

  return cells;
};

// Mock game data
const mockGame: Game = {
  id: "VALID1",
  title: "夏休み",
  theme: "宿題",
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
  creatorId: faker.string.ulid(),
  isPublic: true,
  isPhotoSharingEnabled: true,
  skipImageCheck: false,
  isShuffleEnabled: false,
  requiredBingoLines: 3,
  confidenceThreshold: 0.7,
  maxSubmissionsPerUser: 30,
  status: GameStatus.ACTIVE,
  notes: "これは夏休みの宿題ビンゴです。",
  updatedAt: null,
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

// Mock fetch for all stories
const originalFetch = global.fetch;
global.fetch = ((url: string | URL | Request, init?: RequestInit) => {
  const urlString = url.toString();
  console.log(`Mocked fetch (share): ${urlString}`);

  // Mock game API (exact match, not sub-paths like /board or /participants)
  if (urlString.match(/\/api\/game\/VALID1$/)) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        success: true,
        data: mockGame,
      }),
    } as Response);
  }

  // Mock board API
  if (urlString.includes("/api/game/VALID1/board")) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        success: true,
        data: mockBoard,
      }),
    } as Response);
  }

  // Mock participants API
  if (urlString.includes("/api/game/VALID1/participants")) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        success: true,
        data: mockParticipants,
      }),
    } as Response);
  }

  // Default to original fetch for other requests
  return originalFetch(url as RequestInfo | URL, init);
}) as typeof fetch;

const meta = {
  title: "Pages/Game/Share",
  component: SharePage,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/game/VALID1/share",
        query: {},
        segments: [["gameId", "VALID1"]],
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SharePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PublicGame: Story = {};

export const PrivateGame: Story = {
  decorators: [
    (Story) => {
      // Mock fetch to return a private game
      const storyOriginalFetch = global.fetch;
      global.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        const urlString = url.toString();
        console.log(`Mocked fetch (private): ${urlString}`);

        // Mock game API with private game (exact match)
        if (urlString.match(/\/api\/game\/VALID1$/)) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                ...mockGame,
                isPublic: false,
              },
            }),
          } as Response);
        }

        // Mock board API
        if (urlString.includes("/api/game/VALID1/board")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: mockBoard,
            }),
          } as Response);
        }

        // Mock participants API
        if (urlString.includes("/api/game/VALID1/participants")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: mockParticipants,
            }),
          } as Response);
        }

        // Default to original fetch
        return storyOriginalFetch(url as RequestInfo | URL, init);
      }) as typeof fetch;

      return <Story />;
    },
  ],
};

export const Loading: Story = {
  decorators: [
    (Story) => {
      // Mock fetch to return a pending promise for loading state
      global.fetch = (() => new Promise(() => {})) as typeof fetch;
      return <Story />;
    },
  ],
};

export const GameNotFound: Story = {
  decorators: [
    (Story) => {
      // Mock fetch to return a 404 response
      global.fetch = (() =>
        Promise.resolve({
          ok: false,
          status: 404,
          json: async () => ({ error: "Game not found" }),
        } as Response)) as typeof fetch;
      return <Story />;
    },
  ],
};
