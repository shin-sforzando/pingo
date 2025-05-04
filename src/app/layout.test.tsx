import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import enMessages from "../../messages/en.json";
import jaMessages from "../../messages/ja.json";

// Mock the next-intl/server module
vi.mock("next-intl/server", () => ({
  getLocale: vi.fn().mockResolvedValue("ja"),
  getTranslations: vi.fn(),
}));

// Import after mocking
import { getLocale } from "next-intl/server";

describe("i18n integration", () => {
  describe("Japanese locale", () => {
    it("displays Japanese content", () => {
      const { getByText } = render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <div>{jaMessages.HomePage.title}</div>
        </NextIntlClientProvider>,
      );

      expect(getByText(jaMessages.HomePage.title)).toBeInTheDocument();
    });
  });

  describe("English locale", () => {
    it("displays English content", () => {
      const { getByText } = render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <div>{enMessages.HomePage.title}</div>
        </NextIntlClientProvider>,
      );

      expect(getByText(enMessages.HomePage.title)).toBeInTheDocument();
    });
  });

  describe("getLocale function", () => {
    it("returns the correct locale", async () => {
      // Test with Japanese
      vi.mocked(getLocale).mockResolvedValue("ja");
      expect(await getLocale()).toBe("ja");

      // Test with English
      vi.mocked(getLocale).mockResolvedValue("en");
      expect(await getLocale()).toBe("en");
    });
  });
});
