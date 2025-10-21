import { fakerJA as faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs";
// Mock next/navigation
import * as nextNavigation from "next/navigation";
import { AuthContext } from "@/contexts/AuthContext";
import CreateGamePage from "./page";

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
  nextNavigation.usePathname = () => "/game/create";
} catch (error) {
  console.warn("Could not mock next/navigation:", error);
}

// Mock Firebase auth
if (typeof window !== "undefined") {
  // @ts-expect-error - Global mock for Firebase
  window.firebase = {
    auth: () => ({
      currentUser: {
        getIdToken: async () => "mock-id-token",
        uid: faker.string.ulid(),
      },
    }),
  };
}

// Mock authenticated user
const mockUser = {
  id: faker.string.ulid(),
  username: faker.person.fullName(),
  createdAt: new Date(),
  lastLoginAt: new Date(),
  participatingGames: [],
  gameHistory: [],
  isTestUser: true,
};

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

  // Mock subjects generation API
  if (urlString.includes("/api/subjects/generate")) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ok: true,
          json: async () => ({
            candidates: [
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
              "神社",
              "お寺",
              "お城",
              "橋",
              "公園",
              "噴水",
            ],
          }),
        } as Response);
      }, 1500);
    });
  }

  // Mock subjects check API
  if (urlString.includes("/api/subjects/check")) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        ok: true,
        issues: [],
      }),
    } as Response);
  }

  // Mock game creation API
  if (urlString.includes("/api/game/create")) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              gameId: "GAME01",
            },
          }),
        } as Response);
      }, 1000);
    });
  }

  // Default to original fetch
  return originalFetch(url as RequestInfo | URL, init);
}) as typeof fetch;

const meta = {
  title: "Pages/Game/Create",
  component: CreateGamePage,
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
} satisfies Meta<typeof CreateGamePage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state - empty form ready for input
 */
export const Default: Story = {};

/**
 * Form with basic information filled in
 */
export const FormFilled: Story = {
  play: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const titleInput = document.querySelector(
      'input[name="title"]',
    ) as HTMLInputElement;
    if (titleInput) {
      titleInput.value = "冬休みビンゴ";
      titleInput.dispatchEvent(new Event("input", { bubbles: true }));
      titleInput.dispatchEvent(new Event("blur", { bubbles: true }));
    }

    const themeInput = document.querySelector(
      'input[name="theme"]',
    ) as HTMLInputElement;
    if (themeInput) {
      themeInput.value = "冬の風物詩";
      themeInput.dispatchEvent(new Event("input", { bubbles: true }));
      themeInput.dispatchEvent(new Event("blur", { bubbles: true }));
    }
  },
};
