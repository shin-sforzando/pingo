import { page } from "@vitest/browser/context";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { Header } from "./Header";

import enMessages from "../../../messages/en.json";
import jaMessages from "../../../messages/ja.json";

// Define mocked functions using vi.hoisted
const mockUseAuth = vi.hoisted(() => vi.fn());

// Mock the AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: mockUseAuth,
}));

// Mock the components
vi.mock("./LanguageSwitcher", () => ({
  LanguageSwitcher: () => (
    <div data-testid="language-switcher">LanguageSwitcher</div>
  ),
}));

vi.mock("./NotificationIcon", () => ({
  NotificationIcon: ({
    hasUnreadNotifications,
  }: { hasUnreadNotifications: boolean }) => (
    <div data-testid="notification-icon" data-unread={hasUnreadNotifications}>
      NotificationIcon
    </div>
  ),
}));

vi.mock("./UserMenu", () => ({
  UserMenu: () => <div data-testid="user-menu">UserMenu</div>,
}));

// Mock next/link
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    className,
    children,
  }: { href: string; className?: string; children: React.ReactNode }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("Header", () => {
  it("renders without crashing", () => {
    expect(() => (
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <Header />
      </NextIntlClientProvider>
    )).not.toThrow();
  });

  describe("when user is not logged in", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: null,
      });
    });

    it("displays the app name", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <Header />
        </NextIntlClientProvider>,
      );

      const appName = page.getByTestId("app-name");
      await expect.element(appName).toBeVisible();
      await expect
        .element(appName)
        .toHaveTextContent(jaMessages.Common.appName);
    });

    it("displays the LanguageSwitcher", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <Header />
        </NextIntlClientProvider>,
      );

      const languageSwitcher = page.getByTestId("language-switcher");
      await expect.element(languageSwitcher).toBeVisible();
    });

    it("does not display the NotificationIcon and UserMenu", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <Header />
        </NextIntlClientProvider>,
      );

      // Check that notification icon and user menu are not present
      await expect
        .element(page.getByTestId("notification-icon"))
        .not.toBeInTheDocument();
      await expect
        .element(page.getByTestId("user-menu"))
        .not.toBeInTheDocument();
    });
  });

  describe("when user is logged in", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "01HBQC7Z7ZZ9ZQ0Z4Z0Z0Z0Z0",
          username: "TestUser",
          createdAt: new Date(),
          lastLoginAt: new Date(),
          participatingGames: [],
          gameHistory: [],
          isTestUser: true,
        },
        loading: false,
        error: null,
      });
    });

    it("displays the app name", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <Header />
        </NextIntlClientProvider>,
      );

      const appName = page.getByTestId("app-name");
      await expect.element(appName).toBeVisible();
      await expect
        .element(appName)
        .toHaveTextContent(jaMessages.Common.appName);
    });

    it("does not display the LanguageSwitcher", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <Header />
        </NextIntlClientProvider>,
      );

      // Check that language switcher is not present
      await expect
        .element(page.getByTestId("language-switcher"))
        .not.toBeInTheDocument();
    });

    it("displays the NotificationIcon and UserMenu", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <Header />
        </NextIntlClientProvider>,
      );

      const notificationIcon = page.getByTestId("notification-icon");
      const userMenu = page.getByTestId("user-menu");

      await expect.element(notificationIcon).toBeVisible();
      await expect.element(userMenu).toBeVisible();
    });

    it("passes hasUnreadNotifications prop to NotificationIcon", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <Header />
        </NextIntlClientProvider>,
      );

      const notificationIcon = page.getByTestId("notification-icon");
      await expect
        .element(notificationIcon)
        .toHaveAttribute("data-unread", "true");
    });
  });

  describe("with English locale", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: null,
      });
    });

    it("displays the app name in English", async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <Header />
        </NextIntlClientProvider>,
      );

      const appName = page.getByTestId("app-name");
      await expect.element(appName).toBeVisible();
      await expect
        .element(appName)
        .toHaveTextContent(enMessages.Common.appName);
    });
  });
});
