import { GameStatus } from "@/types/common";
import type { Cell, Game } from "@/types/schema";
import { fakerJA as faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/react";
import SharePage from "./page";

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
  requiredBingoLines: 3,
  confidenceThreshold: 0.7,
  maxSubmissionsPerUser: 30,
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

// Mock next/navigation for Storybook
import * as nextNavigation from "next/navigation";

// Create a mock function for useParams
const mockUseParams = () => ({ gameId: "VALID1" });

// Override the useParams function if possible
try {
  // @ts-ignore - This is a mock for Storybook
  nextNavigation.useParams = mockUseParams;
} catch (error) {
  console.warn("Could not mock useParams:", error);
}

// Mock fetch for all stories
if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    const url = input.toString();
    console.log(`Mocked fetch: ${url}`);

    // Always return success for any game ID to avoid "game not found" error
    if (url.includes("/api/game/")) {
      if (url.endsWith("/board")) {
        return {
          ok: true,
          json: async () => mockBoard,
        } as Response;
      }
      if (url.endsWith("/participants")) {
        return {
          ok: true,
          json: async () => mockParticipants,
        } as Response;
      }
      return {
        ok: true,
        json: async () => mockGame,
      } as Response;
    }

    // Default to original fetch for other requests
    return originalFetch(input, init);
  };
}

const meta = {
  title: "Pages/Game/Share",
  component: SharePage,
  parameters: {
    layout: "fullscreen",
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
      if (typeof window !== "undefined") {
        const originalFetch = window.fetch;
        // Override fetch for this story
        window.fetch = async (input, init) => {
          const url = input.toString();
          console.log(`Mocked fetch: ${url}`);

          // Always return success for any game ID to avoid "game not found" error
          if (url.includes("/api/game/")) {
            if (url.endsWith("/board")) {
              return {
                ok: true,
                json: async () => mockBoard,
              } as Response;
            }
            if (url.endsWith("/participants")) {
              return {
                ok: true,
                json: async () => mockParticipants,
              } as Response;
            }
            // Return a private game
            return {
              ok: true,
              json: async () => ({
                ...mockGame,
                isPublic: false,
              }),
            } as Response;
          }

          // Default to original fetch for other requests
          return originalFetch(input, init);
        };
      }
      return <Story />;
    },
  ],
};

export const Loading: Story = {
  decorators: [
    (Story) => {
      // Mock fetch to return a pending promise for loading state
      if (typeof window !== "undefined") {
        // Override fetch for this story
        window.fetch = async () => new Promise(() => {});
      }
      return <Story />;
    },
  ],
};

export const GameNotFound: Story = {
  decorators: [
    (Story) => {
      // Mock fetch to return a 404 response
      if (typeof window !== "undefined") {
        // Override fetch for this story
        window.fetch = async () =>
          ({
            ok: false,
            status: 404,
            json: async () => ({ error: "Game not found" }),
          }) as Response;
      }
      return <Story />;
    },
  ],
};
