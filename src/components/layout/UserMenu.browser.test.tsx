import { faker } from "@faker-js/faker";
import { page, userEvent } from "@vitest/browser/context";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import enMessages from "../../../messages/en.json";
import jaMessages from "../../../messages/ja.json";
import { UserMenu } from "./UserMenu";

// Define mocked functions using vi.hoisted
const mockLogout = vi.hoisted(() => vi.fn());
const mockRouterRefresh = vi.hoisted(() => vi.fn());

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

describe("UserMenu", () => {
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

    const avatar = page.getByText("T"); // First letter of "TestUser"
    await expect.element(avatar).toBeVisible();
  });

  it("opens the dropdown menu when clicked", async () => {
    render(
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <UserMenu />
      </NextIntlClientProvider>,
    );

    const avatar = page.getByText("T");
    await userEvent.click(avatar);

    // Check that the dropdown menu is visible
    const username = page.getByText("TestUser");
    await expect.element(username).toBeVisible();
  });

  it("displays the user's participating games", async () => {
    render(
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <UserMenu />
      </NextIntlClientProvider>,
    );

    const avatar = page.getByText("T");
    await userEvent.click(avatar);

    // Check that the recent games section is visible
    const recentGames = page.getByText(jaMessages.Header.recentGames);
    await expect.element(recentGames).toBeVisible();

    // Check that the game links are visible
    const gameLink = page.getByText("Game TEST01...");
    await expect.element(gameLink).toBeVisible();
  });

  it("calls logout when the logout button is clicked", async () => {
    render(
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <UserMenu />
      </NextIntlClientProvider>,
    );

    const avatar = page.getByText("T");
    await userEvent.click(avatar);

    const logoutButton = page.getByText(jaMessages.Header.logout);
    await userEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("toggles locale when the language button is clicked", async () => {
    render(
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <UserMenu />
      </NextIntlClientProvider>,
    );

    const avatar = page.getByText("T");
    await userEvent.click(avatar);

    const languageButton = page.getByText(jaMessages.Common.toLanguage);
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

    const avatar = page.getByText("T");
    await userEvent.click(avatar);

    // Check that the profile link has the correct href
    const profileLink = page.getByRole("link", {
      name: jaMessages.Header.profile,
    });
    await expect.element(profileLink).toBeVisible();
    await expect.element(profileLink).toHaveAttribute("href", "/profile");
  });

  it("displays English text when locale is 'en'", async () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <UserMenu />
      </NextIntlClientProvider>,
    );

    const avatar = page.getByText("T");
    await userEvent.click(avatar);

    // Check that the text is in English
    const profileLink = page.getByText(enMessages.Header.profile);
    await expect.element(profileLink).toBeVisible();
  });
});
