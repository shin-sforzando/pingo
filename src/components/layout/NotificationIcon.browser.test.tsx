import { page, userEvent } from "@vitest/browser/context";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import jaMessages from "../../../messages/ja.json";
import { NotificationIcon } from "./NotificationIcon";

// Mock the NotificationDrawer component
vi.mock("./NotificationDrawer", () => ({
  NotificationDrawer: ({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => (
    <dialog
      data-testid="notification-drawer"
      data-open={open}
      onClick={() => onOpenChange(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape") onOpenChange(false);
      }}
      open={open}
    >
      NotificationDrawer
    </dialog>
  ),
}));

describe("NotificationIcon", () => {
  it("renders without crashing", () => {
    expect(() => (
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <NotificationIcon />
      </NextIntlClientProvider>
    )).not.toThrow();
  });

  it("renders the bell icon", async () => {
    render(
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <NotificationIcon />
      </NextIntlClientProvider>,
    );

    const bellIcon = page.getByRole("button", { name: "Notifications" });
    await expect.element(bellIcon).toBeVisible();
  });

  it("does not show the unread indicator when hasUnreadNotifications is false", async () => {
    render(
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <NotificationIcon hasUnreadNotifications={false} />
      </NextIntlClientProvider>,
    );

    // The unread indicator is a span with aria-hidden="true"
    const unreadIndicator = page.getByTestId("unread-indicator");
    await expect.element(unreadIndicator).not.toBeInTheDocument();
  });

  it("shows the unread indicator when hasUnreadNotifications is true", async () => {
    render(
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <NotificationIcon hasUnreadNotifications={true} />
      </NextIntlClientProvider>,
    );

    // The unread indicator is a span with aria-hidden="true"
    const unreadIndicator = page.getByTestId("unread-indicator");
    await expect.element(unreadIndicator).toBeInTheDocument();
  });

  it("has the correct aria-label when hasUnreadNotifications is true", async () => {
    render(
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <NotificationIcon hasUnreadNotifications={true} />
      </NextIntlClientProvider>,
    );

    const bellIcon = page.getByRole("button", {
      name: "You have unread notifications",
    });
    await expect.element(bellIcon).toBeVisible();
  });

  it("opens the notification drawer when clicked", async () => {
    render(
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <NotificationIcon />
      </NextIntlClientProvider>,
    );

    const bellIcon = page.getByRole("button", { name: "Notifications" });
    await userEvent.click(bellIcon);

    const drawer = page.getByTestId("notification-drawer");
    await expect.element(drawer).toBeVisible();
    await expect.element(drawer).toHaveAttribute("data-open", "true");
  });

  it("closes the notification drawer when the drawer is clicked", async () => {
    render(
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <NotificationIcon />
      </NextIntlClientProvider>,
    );

    // Open the drawer
    const bellIcon = page.getByRole("button", { name: "Notifications" });
    await userEvent.click(bellIcon);

    // Click the drawer to close it
    const drawer = page.getByTestId("notification-drawer");
    await userEvent.click(drawer);

    // Check that the drawer is closed (data-open="false")
    await expect.element(drawer).toHaveAttribute("data-open", "false");
  });
});
