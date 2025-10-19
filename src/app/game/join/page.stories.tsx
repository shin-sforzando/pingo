import { fakerJA as faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { AuthContext } from "@/contexts/AuthContext";
import JoinGamePage from "./page";

// Mock authenticated user
const mockUser = {
  id: faker.string.ulid(),
  username: faker.person.fullName(),
  createdAt: new Date(),
  lastLoginAt: new Date(),
  participatingGames: ["GAME01", "GAME02"],
  gameHistory: [],
  isTestUser: true,
};

// Mock public games
const mockPublicGames = [
  {
    id: "GAME03",
    title: "春の自然観察ビンゴ",
    theme: "春の花と生き物",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    participantCount: 12,
    isPublic: true,
    isParticipating: false,
  },
  {
    id: "GAME04",
    title: "街歩きビンゴ",
    theme: "街中の面白いもの",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    participantCount: 8,
    isPublic: true,
    isParticipating: false,
  },
];

// Mock participating games
const mockParticipatingGames = [
  {
    id: "GAME01",
    title: "夏休みビンゴ",
    theme: "宿題",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    participantCount: 15,
    isPublic: true,
  },
  {
    id: "GAME02",
    title: "秋の味覚ビンゴ",
    theme: "秋の食べ物",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    participantCount: 20,
    isPublic: true,
  },
];

// Mock game for verification
const mockVerifiedGame = {
  id: "GAME05",
  title: "冬のイベントビンゴ",
  theme: "イルミネーションと冬の風物詩",
  createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  isPublic: true,
  isPhotoSharingEnabled: true,
  requiredBingoLines: 3,
  confidenceThreshold: 0.7,
  maxSubmissionsPerUser: 30,
  notes: "冬のイベントを楽しみましょう！",
};

// Mock next/navigation
import * as nextNavigation from "next/navigation";

const mockRouter = {
  push: (url: string) => console.log(`Navigate to: ${url}`),
  replace: (url: string) => console.log(`Replace with: ${url}`),
  back: () => console.log("Navigate back"),
  forward: () => console.log("Navigate forward"),
  refresh: () => console.log("Refresh"),
  prefetch: () => Promise.resolve(),
};

try {
  // @ts-expect-error - Mock for Storybook
  nextNavigation.useRouter = () => mockRouter;
  // @ts-expect-error - Mock for Storybook
  nextNavigation.usePathname = () => "/game/join";
} catch (error) {
  console.warn("Could not mock next/navigation:", error);
}

// Mock useLocale
import * as nextIntl from "next-intl";

try {
  // @ts-expect-error - Mock for Storybook
  nextIntl.useLocale = () => "ja";
} catch (error) {
  console.warn("Could not mock useLocale:", error);
}

// Mock Firebase auth module
import { auth } from "@/lib/firebase/client";

// @ts-expect-error - Mock currentUser
auth.currentUser = {
  getIdToken: async () => "mock-id-token",
  uid: mockUser.id,
};

// Mock fetch for API calls
const originalFetch = global.fetch;
global.fetch = ((url: string | URL | Request, init?: RequestInit) => {
  const urlString = url.toString();
  console.log(`Mocked fetch: ${urlString}`);

  // Mock public games API
  if (urlString.includes("/api/game/public")) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          games: mockPublicGames,
        },
      }),
    } as Response);
  }

  // Mock game verification API (for GAME05) - exact match, not sub-paths
  if (urlString.match(/\/api\/game\/GAME05$/)) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        success: true,
        data: mockVerifiedGame,
      }),
    } as Response);
  }

  // Mock participants API for GAME05
  if (urlString.includes("/api/game/GAME05/participants")) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        success: true,
        data: Array.from({ length: 5 }, (_, i) => ({
          id: `user${i + 1}`,
          username: faker.person.fullName(),
        })),
      }),
    } as Response);
  }

  // Mock game join API
  if (urlString.includes("/join")) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              participationId: faker.string.ulid(),
            },
          }),
        } as Response);
      }, 1000);
    });
  }

  // Mock participating games info
  if (urlString.match(/\/api\/game\/(GAME01|GAME02)$/)) {
    const gameId = urlString.split("/api/game/")[1];
    const game = mockParticipatingGames.find((g) => g.id === gameId);
    if (game) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: game,
        }),
      } as Response);
    }
  }

  // Default to original fetch
  return originalFetch(url as RequestInfo | URL, init);
}) as typeof fetch;

const meta = {
  title: "Pages/Game/Join",
  component: JoinGamePage,
  parameters: {
    layout: "fullscreen",
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
} satisfies Meta<typeof JoinGamePage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state - showing available games and participating games
 */
export const Default: Story = {};

/**
 * User entering a game ID
 */
export const GameIdEntered: Story = {
  play: async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const gameIdInput = document.querySelector(
      'input[name="gameId"]',
    ) as HTMLInputElement;
    if (gameIdInput) {
      // Simulate typing GAME05
      gameIdInput.value = "GAME05";
      gameIdInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
  },
};
