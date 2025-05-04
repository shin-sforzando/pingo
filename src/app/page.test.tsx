import Home from "@/app/page";
import { LocaleProvider } from "@/i18n/LocaleContext";
import { LOCALES } from "@/i18n/config";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

// Mock the useTranslation hook
vi.mock("@/i18n/useTranslation", () => {
  return {
    useTranslation: () => ({
      t: (key: string) => {
        const translations: Record<string, string> = {
          "home.welcome": "Pingoへようこそ",
          "home.getStarted": "始めましょう",
          "home.editFile": "編集するファイル",
        };
        return translations[key] || key;
      },
      locale: LOCALES.JA,
      setLocale: vi.fn(),
    }),
  };
});

describe("HomePage", () => {
  it("renders without crashing", () => {
    // This is a simple test to check if the component renders without throwing an error
    expect(() => <Home />).not.toThrow();
  });

  it("contains the Next.js logo", () => {
    const { getByAltText } = render(
      <LocaleProvider>
        <Home />
      </LocaleProvider>,
    );
    expect(getByAltText("Next.js logo")).toBeInTheDocument();
  });

  it("contains the welcome text", () => {
    const { getByText } = render(
      <LocaleProvider>
        <Home />
      </LocaleProvider>,
    );
    expect(getByText("Pingoへようこそ")).toBeInTheDocument();
  });

  it("contains the get started text", () => {
    const { getByText } = render(
      <LocaleProvider>
        <Home />
      </LocaleProvider>,
    );
    expect(getByText(/始めましょう/)).toBeInTheDocument();
  });
});
