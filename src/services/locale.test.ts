import * as nextHeaders from "next/headers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import { clearUserLocale, getUserLocale, setUserLocale } from "./locale";

// Mock the cookies module
vi.mock("next/headers", async () => {
  return {
    cookies: vi.fn(),
  };
});

describe("locale service", () => {
  const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
  const mockCookieStore = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    // Type assertion is necessary here due to the complexity of the Next.js cookies API
    vi.mocked(nextHeaders.cookies).mockReturnValue(
      mockCookieStore as unknown as ReturnType<typeof nextHeaders.cookies>,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserLocale", () => {
    it("should return the locale from cookie when it exists", async () => {
      // Setup
      const expectedLocale = "en";
      mockCookieStore.get.mockReturnValue({ value: expectedLocale });

      // Execute
      const result = await getUserLocale();

      // Verify
      expect(nextHeaders.cookies).toHaveBeenCalledTimes(1);
      expect(mockCookieStore.get).toHaveBeenCalledWith(LOCALE_COOKIE_NAME);
      expect(result).toBe(expectedLocale);
    });

    it("should return the default locale when cookie doesn't exist", async () => {
      // Setup
      mockCookieStore.get.mockReturnValue(undefined);

      // Execute
      const result = await getUserLocale();

      // Verify
      expect(nextHeaders.cookies).toHaveBeenCalledTimes(1);
      expect(mockCookieStore.get).toHaveBeenCalledWith(LOCALE_COOKIE_NAME);
      expect(result).toBe(defaultLocale);
    });
  });

  describe("setUserLocale", () => {
    it("should set the locale in cookie", async () => {
      // Setup
      const localeToSet = "en";

      // Execute
      await setUserLocale(localeToSet);

      // Verify
      expect(nextHeaders.cookies).toHaveBeenCalledTimes(1);
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        LOCALE_COOKIE_NAME,
        localeToSet,
      );
    });
  });

  describe("clearUserLocale", () => {
    it("should delete the locale cookie", async () => {
      // Execute
      await clearUserLocale();

      // Verify
      expect(nextHeaders.cookies).toHaveBeenCalledTimes(1);
      expect(mockCookieStore.delete).toHaveBeenCalledWith(LOCALE_COOKIE_NAME);
    });
  });
});
