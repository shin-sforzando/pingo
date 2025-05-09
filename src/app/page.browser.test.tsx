import { useAuth } from "@/contexts/AuthContext";
import { page, userEvent } from "@vitest/browser/context";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import Home from "./page";

import type { User } from "firebase/auth";
import enMessages from "../../messages/en.json";
import jaMessages from "../../messages/ja.json";

// Mock the AuthContext for unauthenticated state
const mockUnauthenticatedAuth = {
  user: null,
  userProfile: null,
  isLoading: false,
  error: null,
  register: vi.fn().mockResolvedValue(true),
  login: vi.fn().mockResolvedValue(true),
  logout: vi.fn().mockResolvedValue(true),
  updateProfile: vi.fn().mockResolvedValue(true),
  clearError: vi.fn(),
};

// Mock the AuthContext for authenticated state
const mockAuthenticatedAuth = {
  user: {
    uid: "test-user-id",
    getIdToken: async () => "mock-token",
  } as User,
  userProfile: {
    id: "test-user-id",
    username: "John Doe",
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  isLoading: false,
  error: null,
  register: vi.fn().mockResolvedValue(true),
  login: vi.fn().mockResolvedValue(true),
  logout: vi.fn().mockResolvedValue(true),
  updateProfile: vi.fn().mockResolvedValue(true),
  clearError: vi.fn(),
};

// Mock the AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
  AuthContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

describe("Home Page", () => {
  describe("Unauthenticated state", () => {
    beforeEach(() => {
      // Mock unauthenticated state
      vi.mocked(useAuth).mockReturnValue(mockUnauthenticatedAuth);
    });

    it("displays login form when unauthenticated", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <Home />
        </NextIntlClientProvider>,
      );

      // Check if login form is displayed
      const loginHeading = page.getByRole("heading", {
        name: jaMessages.Auth.login,
      });
      await expect.element(loginHeading).toBeVisible();

      // Check if username field is displayed
      const usernameInput = page.getByLabelText(jaMessages.Auth.username);
      await expect.element(usernameInput).toBeVisible();
    });

    it("switches to register form when register link is clicked", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <Home />
        </NextIntlClientProvider>,
      );

      // Find and click the register link
      const registerLink = page.getByRole("button", {
        name: jaMessages.Auth.register,
      });
      await userEvent.click(registerLink);

      // Check if register form is displayed
      const registerHeading = page.getByRole("heading", {
        name: jaMessages.Auth.register,
      });
      await expect.element(registerHeading).toBeVisible();

      // Check if confirm password field is displayed (unique to register form)
      const confirmPasswordInput = page.getByLabelText(
        jaMessages.Auth.confirmPassword,
      );
      await expect.element(confirmPasswordInput).toBeVisible();
    });

    it("displays How to Play section", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <Home />
        </NextIntlClientProvider>,
      );

      // Check if How to Play section is displayed
      const howToPlayHeading = page.getByRole("heading", {
        name: jaMessages.HomePage.howToPlay,
      });
      await expect.element(howToPlayHeading).toBeVisible();

      // Check if description is displayed
      const description = page.getByText(
        jaMessages.HomePage.howToPlayDescription,
      );
      await expect.element(description).toBeVisible();
    });
  });

  describe("Authenticated state", () => {
    beforeEach(() => {
      // Mock authenticated state
      vi.mocked(useAuth).mockReturnValue(mockAuthenticatedAuth);
    });

    it("displays game options when authenticated", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <Home />
        </NextIntlClientProvider>,
      );

      // Check if Join Game button is displayed
      const joinGameButton = page.getByRole("button", {
        name: jaMessages.HomePage.joinGame,
      });
      await expect.element(joinGameButton).toBeVisible();

      // Check if Create Game button is displayed
      const createGameButton = page.getByRole("button", {
        name: jaMessages.HomePage.createGame,
      });
      await expect.element(createGameButton).toBeVisible();
    });

    it("displays How to Play section", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <Home />
        </NextIntlClientProvider>,
      );

      // Check if How to Play section is displayed
      const howToPlayHeading = page.getByRole("heading", {
        name: jaMessages.HomePage.howToPlay,
      });
      await expect.element(howToPlayHeading).toBeVisible();

      // Check if description is displayed
      const description = page.getByText(
        jaMessages.HomePage.howToPlayDescription,
      );
      await expect.element(description).toBeVisible();
    });
  });

  describe("with English locale", () => {
    beforeEach(() => {
      // Mock unauthenticated state
      vi.mocked(useAuth).mockReturnValue(mockUnauthenticatedAuth);
    });

    it("displays login form with English text", async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <Home />
        </NextIntlClientProvider>,
      );

      // Check if login form is displayed with English text
      const loginHeading = page.getByRole("heading", {
        name: enMessages.Auth.login,
      });
      await expect.element(loginHeading).toBeVisible();
    });

    it("displays How to Play section with English text", async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <Home />
        </NextIntlClientProvider>,
      );

      // Check if How to Play section is displayed with English text
      const howToPlayHeading = page.getByRole("heading", {
        name: enMessages.HomePage.howToPlay,
      });
      await expect.element(howToPlayHeading).toBeVisible();

      // Check if description is displayed with English text
      const description = page.getByText(
        enMessages.HomePage.howToPlayDescription,
      );
      await expect.element(description).toBeVisible();
    });
  });
});
