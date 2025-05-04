import Home from "@/app/page";
import { LocaleProvider } from "@/i18n/LocaleContext";
import { LOCALES } from "@/i18n/config";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

// Define the interface for our translation mock
interface TranslationMock {
  t: (key: string) => string;
  locale: string;
  setLocale: ReturnType<typeof vi.fn>;
}

// Create a mock for useTranslation
const mockSetLocale = vi.fn();

// Japanese translations
const jaMock: TranslationMock = {
  t: (key: string) => {
    const translations: Record<string, string> = {
      "home.welcome": "Pingoへようこそ",
      "home.getStarted": "始めましょう",
      "home.editFile": "編集するファイル",
    };
    return translations[key] || key;
  },
  locale: LOCALES.JA,
  setLocale: mockSetLocale,
};

// English translations
const enMock: TranslationMock = {
  t: (key: string) => {
    const translations: Record<string, string> = {
      "home.welcome": "Welcome to Pingo",
      "home.getStarted": "Let's get started",
      "home.editFile": "Edit file",
    };
    return translations[key] || key;
  },
  locale: LOCALES.EN,
  setLocale: mockSetLocale,
};

// Default to Japanese
let currentMock: TranslationMock = jaMock;

// Mock the useTranslation hook
vi.mock("@/i18n/useTranslation", () => ({
  useTranslation: () => currentMock,
}));

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

  describe("with Japanese locale", () => {
    beforeEach(() => {
      // Set mock to return Japanese translations
      currentMock = jaMock;
    });

    it("contains the welcome text in Japanese", () => {
      const { getByText } = render(
        <LocaleProvider defaultLocale={LOCALES.JA}>
          <Home />
        </LocaleProvider>,
      );
      expect(getByText("Pingoへようこそ")).toBeInTheDocument();
    });

    it("contains the get started text in Japanese", () => {
      const { getByText } = render(
        <LocaleProvider defaultLocale={LOCALES.JA}>
          <Home />
        </LocaleProvider>,
      );
      expect(getByText(/始めましょう/)).toBeInTheDocument();
    });
  });

  describe("with English locale", () => {
    beforeEach(() => {
      // Set mock to return English translations
      currentMock = enMock;
    });

    it("contains the welcome text in English", () => {
      const { getByText } = render(
        <LocaleProvider defaultLocale={LOCALES.EN}>
          <Home />
        </LocaleProvider>,
      );
      expect(getByText("Welcome to Pingo")).toBeInTheDocument();
    });

    it("contains the get started text in English", () => {
      const { getByText } = render(
        <LocaleProvider defaultLocale={LOCALES.EN}>
          <Home />
        </LocaleProvider>,
      );
      expect(getByText(/Let's get started/)).toBeInTheDocument();
    });
  });
});
