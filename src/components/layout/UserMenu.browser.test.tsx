import { page, userEvent } from "@vitest/browser/context";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { UserMenu } from "./UserMenu";

import enMessages from "../../../messages/en.json";
import jaMessages from "../../../messages/ja.json";

// Mock the LanguageSwitcher component
vi.mock("./LanguageSwitcher", () => ({
  LanguageSwitcher: () => (
    <div data-testid="language-switcher">Language Switcher</div>
  ),
}));

describe("UserMenu", () => {
  it("renders without crashing", () => {
    expect(() => (
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <UserMenu />
      </NextIntlClientProvider>
    )).not.toThrow();
  });

  describe("with Japanese locale", () => {
    it("displays user avatar", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <UserMenu />
        </NextIntlClientProvider>,
      );

      // Look for the avatar component by its test id
      const avatar = page.getByTestId("my-avatar");
      await expect.element(avatar).toBeVisible();
    });

    it("shows popover content when avatar is clicked", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <UserMenu />
        </NextIntlClientProvider>,
      );

      // Find and click the avatar button
      const avatar = page.getByTestId("my-avatar");
      await userEvent.click(avatar);

      // Check if profile settings and logout buttons are displayed using expect.element
      const profileButton = page.getByText(jaMessages.Header.profileSettings);
      await expect.element(profileButton).toBeVisible();

      const logoutButton = page.getByText(jaMessages.Header.logout);
      await expect.element(logoutButton).toBeVisible();

      // Check if language switcher is included
      const languageSwitcher = page.getByTestId("language-switcher");
      await expect.element(languageSwitcher).toBeVisible();
    });
  });

  describe("with English locale", () => {
    it("shows popover content with English text when avatar is clicked", async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <UserMenu />
        </NextIntlClientProvider>,
      );

      // Find and click the avatar button
      const avatar = page.getByTestId("my-avatar");
      await userEvent.click(avatar);

      // Check if profile settings and logout buttons are displayed in English
      const profileButton = page.getByText(enMessages.Header.profileSettings);
      await expect.element(profileButton).toBeVisible();

      const logoutButton = page.getByText(enMessages.Header.logout);
      await expect.element(logoutButton).toBeVisible();
    });
  });
});
