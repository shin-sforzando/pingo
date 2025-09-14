import { page, userEvent } from "@vitest/browser/context";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import enMessages from "../../../messages/en.json";
import jaMessages from "../../../messages/ja.json";
import { LanguageSwitcher } from "./LanguageSwitcher";

// Mock the router and setUserLocale
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock("@/services/locale", () => ({
  setUserLocale: vi.fn(),
}));

describe("LanguageSwitcher", () => {
  it("renders without crashing", () => {
    expect(() => (
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <LanguageSwitcher />
      </NextIntlClientProvider>
    )).not.toThrow();
  });

  describe("with Japanese locale", () => {
    it(`displays '${jaMessages.Common.toLanguage}' as the language option`, async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <LanguageSwitcher />
        </NextIntlClientProvider>,
      );

      const button = page.getByRole("button");
      await expect
        .element(button)
        .toHaveTextContent(jaMessages.Common.toLanguage);
    });

    it("calls setUserLocale with 'en' when clicked", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <LanguageSwitcher />
        </NextIntlClientProvider>,
      );

      const button = page.getByRole("button");
      await userEvent.click(button);

      const { setUserLocale } = await import("@/services/locale");
      expect(setUserLocale).toHaveBeenCalledWith("en");
    });
  });

  describe("with English locale", () => {
    it(`displays '${enMessages.Common.toLanguage}' as the language option`, async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <LanguageSwitcher />
        </NextIntlClientProvider>,
      );

      const button = page.getByRole("button");
      await expect
        .element(button)
        .toHaveTextContent(enMessages.Common.toLanguage);
    });

    it("calls setUserLocale with 'ja' when clicked", async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <LanguageSwitcher />
        </NextIntlClientProvider>,
      );

      const button = page.getByRole("button");
      await userEvent.click(button);

      const { setUserLocale } = await import("@/services/locale");
      expect(setUserLocale).toHaveBeenCalledWith("ja");
    });
  });
});
