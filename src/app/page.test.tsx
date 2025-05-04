import Home from "@/app/page";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import enMessages from "../../messages/en.json";
// Import messages for testing
import jaMessages from "../../messages/ja.json";

describe("HomePage", () => {
  it("renders without crashing", () => {
    // This is a simple test to check if the component renders without throwing an error
    expect(() => (
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <Home />
      </NextIntlClientProvider>
    )).not.toThrow();
  });

  it("contains the Next.js logo", () => {
    const { getByAltText } = render(
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <Home />
      </NextIntlClientProvider>,
    );
    expect(getByAltText("Next.js logo")).toBeInTheDocument();
  });

  describe("with Japanese locale", () => {
    it("displays Japanese title", () => {
      const { getByText } = render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <Home />
        </NextIntlClientProvider>,
      );
      expect(getByText(jaMessages.HomePage.title)).toBeInTheDocument();
    });

    it("displays Japanese instructions", () => {
      const { getByText } = render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <Home />
        </NextIntlClientProvider>,
      );
      // Check for Japanese text
      expect(getByText(/編集を始める/)).toBeInTheDocument();
      expect(getByText(/保存して変更をすぐに確認できます/)).toBeInTheDocument();
    });
  });

  describe("with English locale", () => {
    it("displays English title", () => {
      const { getByText } = render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <Home />
        </NextIntlClientProvider>,
      );
      expect(getByText(enMessages.HomePage.title)).toBeInTheDocument();
    });

    it("displays English instructions", () => {
      const { getByText } = render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <Home />
        </NextIntlClientProvider>,
      );
      // Check for English text
      expect(getByText(/Get started/)).toBeInTheDocument();
      expect(
        getByText(/Save and see your changes instantly/),
      ).toBeInTheDocument();
    });
  });
});
