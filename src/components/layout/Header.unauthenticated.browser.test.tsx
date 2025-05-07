import { page } from "@vitest/browser/context";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { Header } from "./Header";

import jaMessages from "../../../messages/ja.json";

// Mock the AuthContext for unauthenticated user
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

// Mock the NotificationDrawer, UserMenu, and LanguageSwitcher components
vi.mock("./NotificationDrawer", () => ({
  NotificationDrawer: ({
    open,
    onOpenChange,
  }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
    <div data-testid="notification-drawer" data-open={open.toString()}>
      Notification Drawer
      {open && (
        <button type="button" onClick={() => onOpenChange(false)}>
          Close
        </button>
      )}
    </div>
  ),
}));

vi.mock("./UserMenu", () => ({
  UserMenu: () => <div data-testid="user-menu">User Menu</div>,
}));

vi.mock("./LanguageSwitcher", () => ({
  LanguageSwitcher: () => (
    <div data-testid="language-switcher">Language Switcher</div>
  ),
}));

// Mock the Bell icon
vi.mock("lucide-react", () => ({
  Bell: () => <div data-testid="bell-icon">Bell Icon</div>,
}));

describe("Header with unauthenticated user", () => {
  describe("with Japanese locale", () => {
    it("displays language switcher and hides notification button and user menu", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <Header />
        </NextIntlClientProvider>,
      );

      // Language switcher should be visible
      const languageSwitcher = page.getByTestId("language-switcher");
      await expect.element(languageSwitcher).toBeVisible();

      // Bell icon and user menu should not be in the document
      try {
        page.getByTestId("bell-icon");
        throw new Error("Bell icon should not be visible");
      } catch {
        // Expected error - element not found
      }

      try {
        page.getByTestId("user-menu");
        throw new Error("User menu should not be visible");
      } catch {
        // Expected error - element not found
      }
    });
  });
});
