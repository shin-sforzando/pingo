import Home from "@/app/page";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import enMessages from "../../messages/en.json";
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

  describe("with Japanese locale", () => {
    it("displays Japanese instructions", () => {
      const { getByText } = render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <Home />
        </NextIntlClientProvider>,
      );
      // Check for Japanese text
      expect(getByText(jaMessages.HomePage.editFile)).toBeInTheDocument();
      expect(getByText(jaMessages.HomePage.saveChanges)).toBeInTheDocument();
    });
  });

  describe("with English locale", () => {
    it("displays English instructions", () => {
      const { getByText } = render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <Home />
        </NextIntlClientProvider>,
      );
      // Check for English text
      expect(getByText(enMessages.HomePage.editFile)).toBeInTheDocument();
      expect(getByText(enMessages.HomePage.saveChanges)).toBeInTheDocument();
    });
  });
});
