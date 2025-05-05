import { page, userEvent } from "@vitest/browser/context";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { NotificationDrawer } from "./NotificationDrawer";

import enMessages from "../../../messages/en.json";
import jaMessages from "../../../messages/ja.json";

describe("NotificationDrawer", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    mockOnOpenChange.mockReset();
  });

  it("renders without crashing when closed", () => {
    expect(() => (
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <NotificationDrawer open={false} onOpenChange={mockOnOpenChange} />
      </NextIntlClientProvider>
    )).not.toThrow();
  });

  it("renders without crashing when open", () => {
    expect(() => (
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <NotificationDrawer open={true} onOpenChange={mockOnOpenChange} />
      </NextIntlClientProvider>
    )).not.toThrow();
  });

  describe("with Japanese locale", () => {
    it("displays Japanese title and description when open", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <NotificationDrawer open={true} onOpenChange={mockOnOpenChange} />
        </NextIntlClientProvider>,
      );

      const title = page.getByRole("heading");
      await expect
        .element(title)
        .toHaveTextContent(jaMessages.Header.notifications);

      // Find the description element and check its content
      const description = page.getByText(
        jaMessages.Header.notificationsDescription,
      );
      await expect.element(description).toBeVisible();
    });

    it("calls onOpenChange when close button is clicked", async () => {
      const { getByText } = render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <NotificationDrawer open={true} onOpenChange={mockOnOpenChange} />
        </NextIntlClientProvider>,
      );

      const closeButton = getByText("Close");
      await userEvent.click(closeButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("with English locale", () => {
    it("displays English title and description when open", async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <NotificationDrawer open={true} onOpenChange={mockOnOpenChange} />
        </NextIntlClientProvider>,
      );

      const title = page.getByRole("heading");
      await expect
        .element(title)
        .toHaveTextContent(enMessages.Header.notifications);

      // Find the description element and check its content
      const description = page.getByText(
        enMessages.Header.notificationsDescription,
      );
      await expect.element(description).toBeVisible();
    });
  });
});
