import { page } from "@vitest/browser/context";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { Header } from "./Header";

import enMessages from "../../../messages/en.json";
import jaMessages from "../../../messages/ja.json";

// Mock the AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    userProfile: null,
    isLoading: false,
    error: null,
    register: async () => false,
    login: async () => false,
    logout: async () => false,
    updateProfile: async () => false,
    clearError: () => {},
  }),
}));

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

describe("Header", () => {
  it("renders without crashing", () => {
    expect(() => (
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <Header />
      </NextIntlClientProvider>
    )).not.toThrow();
  });

  describe("with Japanese locale", () => {
    it("displays the app name", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <Header />
        </NextIntlClientProvider>,
      );

      const appName = page.getByTestId("app-name");
      await expect.element(appName).toBeVisible();
    });
  });

  describe("with English locale", () => {
    it("displays the app name", async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <Header />
        </NextIntlClientProvider>,
      );

      const appName = page.getByTestId("app-name");
      await expect.element(appName).toBeVisible();
    });
  });
});
