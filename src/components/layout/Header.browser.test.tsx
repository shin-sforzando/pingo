import { page, userEvent } from "@vitest/browser/context";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { Header } from "./Header";

import enMessages from "../../../messages/en.json";
import jaMessages from "../../../messages/ja.json";

// Mock the NotificationDrawer and UserMenu components
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

// Mock the Bell icon
vi.mock("lucide-react", () => ({
  Bell: () => <div data-testid="bell-icon">Bell Icon</div>,
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

      const appName = page.getByText(jaMessages.Common.appName);
      await expect.element(appName).toBeVisible();
    });

    it("contains notification button and user menu", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <Header />
        </NextIntlClientProvider>,
      );

      const bellIcon = page.getByTestId("bell-icon");
      await expect.element(bellIcon).toBeVisible();

      const userMenu = page.getByTestId("user-menu");
      await expect.element(userMenu).toBeVisible();
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

  describe("with English locale", () => {
    it("displays the app name", async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <Header />
        </NextIntlClientProvider>,
      );

      const appName = page.getByText(enMessages.Common.appName);
      await expect.element(appName).toBeVisible();
    });
  });
});
