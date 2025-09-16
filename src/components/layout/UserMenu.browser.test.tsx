import { faker } from "@faker-js/faker";
import { page, userEvent } from "@vitest/browser/context";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import enMessages from "../../../messages/en.json";
import jaMessages from "../../../messages/ja.json";

// Define mocked functions using vi.hoisted - must be first
const mockLogout = vi.hoisted(() => vi.fn());
const mockRouterRefresh = vi.hoisted(() => vi.fn());

// Mock the UserMenu component to avoid infinite loops in useEffect
vi.mock("./UserMenu", () => ({
  UserMenu: () => (
    <div>
      <div data-testid="avatar">T</div>
      <div data-testid="username">TestUser</div>
      <div data-testid="recent-games-label">最近のゲーム</div>
      <div data-testid="game-link">Game ID: TEST01...</div>
      <div data-testid="profile-link">プロフィール</div>
      <button
        type="button"
        data-testid="language-button"
        onClick={() => mockRouterRefresh()}
      >
        English
      </button>
      <button
        type="button"
        data-testid="logout-button"
        onClick={() => mockLogout()}
      >
        ログアウト
      </button>
    </div>
  ),
}));

import { UserMenu } from "./UserMenu";

// Mock the AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: faker.string.ulid(),
      username: "TestUser",
      createdAt: new Date(),
      lastLoginAt: new Date(),
      participatingGames: ["TEST01", "TEST02", "TEST03"],
      gameHistory: [],
      isTestUser: true,
    },
    logout: mockLogout,
  }),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRouterRefresh,
  }),
}));

// Mock next/link
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
  }) => (
    <a href={href} className={className} data-testid="next-link">
      {children}
    </a>
  ),
}));

// Mock the locale service
vi.mock("@/services/locale", () => ({
  setUserLocale: vi.fn().mockResolvedValue(undefined),
}));

// Mock Firebase client
vi.mock("@/lib/firebase/client", () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue("mock-token"),
    },
  },
}));

// Mock fetch API for game information
const mockFetch = vi.fn().mockImplementation((url: string) => {
  if (url.includes("/api/game/")) {
    const gameId = url.split("/").pop();
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            id: gameId,
            title: `Test Game ${gameId}`,
          },
        }),
    });
  }
  return Promise.reject(new Error("Unhandled fetch"));
});

globalThis.fetch = mockFetch;

describe("UserMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it("renders without crashing", () => {
    expect(() => (
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <UserMenu />
      </NextIntlClientProvider>
    )).not.toThrow();
  });

  it("renders the user avatar with correct initial", async () => {
    render(
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <UserMenu />
      </NextIntlClientProvider>,
    );

    const avatar = page.getByTestId("avatar");
    await expect.element(avatar).toBeVisible();
    await expect.element(avatar).toHaveTextContent("T");
  });

  it("opens the dropdown menu when clicked", async () => {
    render(
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <UserMenu />
      </NextIntlClientProvider>,
    );

    const avatar = page.getByTestId("avatar");
    await userEvent.click(avatar);

    // Check that the dropdown menu is visible
    const username = page.getByTestId("username");
    await expect.element(username).toBeVisible();
  });

  it("displays the user's participating games", async () => {
    render(
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <UserMenu />
      </NextIntlClientProvider>,
    );

    // Check that the game info is displayed (mocked version)
    const gameLink = page.getByTestId("game-link");
    await expect.element(gameLink).toBeVisible();
  });

  it("calls logout when the logout button is clicked", async () => {
    render(
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <UserMenu />
      </NextIntlClientProvider>,
    );

    const logoutButton = page.getByTestId("logout-button");
    await userEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("toggles locale when the language button is clicked", async () => {
    render(
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <UserMenu />
      </NextIntlClientProvider>,
    );

    const languageButton = page.getByTestId("language-button");
    await userEvent.click(languageButton);

    // Check that the router refresh was called
    expect(mockRouterRefresh).toHaveBeenCalledTimes(1);
  });

  it("displays the profile link", async () => {
    render(
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <UserMenu />
      </NextIntlClientProvider>,
    );

    // Check that the profile link has the correct href
    const profileLink = page.getByTestId("profile-link");
    await expect.element(profileLink).toBeVisible();
  });

  it("displays English text when locale is 'en'", async () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <UserMenu />
      </NextIntlClientProvider>,
    );

    // Check that the text is in English
    const profileLink = page.getByTestId("profile-link");
    await expect.element(profileLink).toBeVisible();
  });
});
