import { page, userEvent } from "@vitest/browser/context";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { Header } from "./Header";

import type { User } from "firebase/auth";
import jaMessages from "../../../messages/ja.json";

// Mock the AuthContext for authenticated user
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "test-user-id" } as User,
    userProfile: {
      id: "test-user-id",
      username: "John Doe",
      createdAt: "",
      lastLoginAt: "",
    },
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

describe("Header with authenticated user", () => {
  describe("with Japanese locale", () => {
    it("displays notification button and user menu and hides language switcher", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <Header />
        </NextIntlClientProvider>,
      );

      // Bell icon and user menu should be visible
      const bellIcon = page.getByTestId("bell-icon");
      await expect.element(bellIcon).toBeVisible();

      const userMenu = page.getByTestId("user-menu");
      await expect.element(userMenu).toBeVisible();

      // Language switcher should not be in the document
      try {
        page.getByTestId("language-switcher");
        throw new Error("Language switcher should not be visible");
      } catch {
        // Expected error - element not found
      }
    });

    it("opens notification drawer when bell icon is clicked", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <Header />
        </NextIntlClientProvider>,
      );

      // Find the button with aria-label="Notifications"
      const bellButton = page.getByRole("button", { name: "Notifications" });
      await userEvent.click(bellButton);

      // Check if the drawer is open
      const drawer = page.getByTestId("notification-drawer");
      await expect.element(drawer).toHaveAttribute("data-open", "true");
    });
  });
});
