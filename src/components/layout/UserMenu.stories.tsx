import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { AuthContext } from "@/contexts/AuthContext";
import { UserMenu } from "./UserMenu";

// Mock fetch for Storybook to simulate API responses
const mockFetchForParticipatingGames = (_gameIds: string[]) => {
  const originalFetch = global.fetch;
  global.fetch = ((url: string | URL | Request, ...args: unknown[]) => {
    const urlString = url.toString();

    // Mock game info API
    if (
      urlString.includes("/api/game/") &&
      !urlString.includes("/participants")
    ) {
      const gameId = urlString.split("/api/game/")[1];
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: gameId,
            title: faker.company.catchPhrase(),
            expiresAt: faker.date.future(),
          },
        }),
      } as Response);
    }

    // Call original fetch for other requests
    return originalFetch(url as RequestInfo | URL, args[0] as RequestInit);
  }) as typeof fetch;

  return () => {
    global.fetch = originalFetch;
  };
};

const meta = {
  title: "Layout/UserMenu",
  component: UserMenu,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="flex items-center justify-center p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof UserMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => {
      const gameIds = faker.helpers.multiple(
        () => faker.string.alpha({ casing: "upper", length: 6 }),
        { count: { min: 1, max: 5 } },
      );

      // Mock fetch for participating games
      const cleanup = mockFetchForParticipatingGames(gameIds);

      // Cleanup when story unmounts
      if (typeof window !== "undefined") {
        window.addEventListener("beforeunload", cleanup);
      }

      return (
        <AuthContext.Provider
          value={{
            user: {
              id: faker.string.ulid(),
              username: "TestUser",
              createdAt: new Date(),
              lastLoginAt: new Date(),
              participatingGames: gameIds,
              gameHistory: [],
              isTestUser: true,
            },
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
      );
    },
  ],
};

export const WithoutGames: Story = {
  decorators: [
    (Story) => (
      <AuthContext.Provider
        value={{
          user: {
            id: faker.string.ulid(),
            username: "NoGamesUser",
            createdAt: new Date(),
            lastLoginAt: new Date(),
            participatingGames: [],
            gameHistory: [],
            isTestUser: true,
          },
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
};
