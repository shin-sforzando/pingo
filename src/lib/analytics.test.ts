import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  hasUserConsent,
  setUserConsent,
  trackBingoAchieved,
  trackCellMatched,
  trackEvent,
  trackGameCompleted,
  trackGameCreated,
  trackGameJoined,
  trackGameStarted,
  trackGeminiAnalysisFailed,
  trackImageNoMatch,
  trackImageRejected,
  trackImageUploaded,
  trackImageUploadFailed,
} from "./analytics";

describe("analytics", () => {
  let localStorageMock: { [key: string]: string };
  let gtagMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      key: vi.fn(),
      length: 0,
    };

    // Mock gtag
    gtagMock = vi.fn();
    global.window = {
      gtag: gtagMock,
    } as unknown as Window & typeof globalThis;

    // Mock environment variables
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST123");
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe("hasUserConsent", () => {
    it("should return true when consent is granted", () => {
      localStorageMock.pingo_analytics_consent = "granted";
      expect(hasUserConsent()).toBe(true);
    });

    it("should return false when consent is denied", () => {
      localStorageMock.pingo_analytics_consent = "denied";
      expect(hasUserConsent()).toBe(false);
    });

    it("should return false when no consent is stored (opt-in approach)", () => {
      expect(hasUserConsent()).toBe(false);
    });

    it("should handle localStorage errors gracefully", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      global.localStorage.getItem = vi.fn(() => {
        throw new Error("localStorage not available");
      });

      expect(hasUserConsent()).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("setUserConsent", () => {
    it("should store 'granted' when consent is given", () => {
      setUserConsent(true);
      expect(localStorageMock.pingo_analytics_consent).toBe("granted");
    });

    it("should store 'denied' when consent is refused", () => {
      setUserConsent(false);
      expect(localStorageMock.pingo_analytics_consent).toBe("denied");
    });

    it("should update gtag consent mode when consent is granted", () => {
      setUserConsent(true);
      expect(gtagMock).toHaveBeenCalledWith("consent", "update", {
        analytics_storage: "granted",
      });
    });

    it("should update gtag consent mode when consent is denied", () => {
      setUserConsent(false);
      expect(gtagMock).toHaveBeenCalledWith("consent", "update", {
        analytics_storage: "denied",
      });
    });

    it("should handle localStorage errors gracefully", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      global.localStorage.setItem = vi.fn(() => {
        throw new Error("localStorage not available");
      });

      setUserConsent(true);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("trackEvent", () => {
    it("should not send events when user has not consented", () => {
      localStorageMock.pingo_analytics_consent = "denied";
      trackEvent("game_created", { game_id: "test-game", board_size: "3x3" });
      expect(gtagMock).not.toHaveBeenCalled();
    });

    it("should send events when user has consented", () => {
      localStorageMock.pingo_analytics_consent = "granted";
      trackEvent("game_joined", { game_id: "test-game" });
      expect(gtagMock).toHaveBeenCalledWith("event", "game_joined", {
        game_id: "test-game",
      });
    });

    it("should not send events when GA measurement ID is not set", () => {
      localStorageMock.pingo_analytics_consent = "granted";
      delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

      trackEvent("game_started", { game_id: "test-game" });
      expect(gtagMock).not.toHaveBeenCalled();
    });

    it("should not send events when gtag is not available", () => {
      localStorageMock.pingo_analytics_consent = "granted";
      global.window.gtag = undefined;

      trackEvent("game_started", { game_id: "test-game" });
      expect(gtagMock).not.toHaveBeenCalled();
    });

    it("should handle gtag errors gracefully in production", () => {
      localStorageMock.pingo_analytics_consent = "granted";
      vi.stubEnv("NODE_ENV", "production");
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      gtagMock.mockImplementation(() => {
        throw new Error("gtag error");
      });

      trackEvent("game_completed", { game_id: "test-game" });
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("should log gtag errors in development", () => {
      localStorageMock.pingo_analytics_consent = "granted";
      vi.stubEnv("NODE_ENV", "development");
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      gtagMock.mockImplementation(() => {
        throw new Error("gtag error");
      });

      trackEvent("image_no_match", { game_id: "test-game" });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Analytics tracking error:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("game event tracking functions", () => {
    beforeEach(() => {
      localStorageMock.pingo_analytics_consent = "granted";
    });

    it("trackGameCreated should send correct event", () => {
      trackGameCreated("game123", 5);
      expect(gtagMock).toHaveBeenCalledWith("event", "game_created", {
        game_id: "game123",
        board_size: "5x5",
      });
    });

    it("trackGameJoined should send correct event", () => {
      trackGameJoined("game456");
      expect(gtagMock).toHaveBeenCalledWith("event", "game_joined", {
        game_id: "game456",
      });
    });

    it("trackGameStarted should send correct event", () => {
      trackGameStarted("game789");
      expect(gtagMock).toHaveBeenCalledWith("event", "game_started", {
        game_id: "game789",
      });
    });

    it("trackGameCompleted should send correct event", () => {
      trackGameCompleted("game999");
      expect(gtagMock).toHaveBeenCalledWith("event", "game_completed", {
        game_id: "game999",
      });
    });
  });

  describe("image tracking functions", () => {
    beforeEach(() => {
      localStorageMock.pingo_analytics_consent = "granted";
    });

    it("trackImageUploaded should send correct event", () => {
      trackImageUploaded("game123", "cell456");
      expect(gtagMock).toHaveBeenCalledWith("event", "image_uploaded", {
        game_id: "game123",
        cell_id: "cell456",
      });
    });

    it("trackCellMatched should send correct event", () => {
      trackCellMatched("game123", "cell456", "cat");
      expect(gtagMock).toHaveBeenCalledWith("event", "cell_matched", {
        game_id: "game123",
        cell_id: "cell456",
        subject: "cat",
      });
    });

    it("trackBingoAchieved should send correct event", () => {
      trackBingoAchieved("game123", "row");
      expect(gtagMock).toHaveBeenCalledWith("event", "bingo_achieved", {
        game_id: "game123",
        pattern_type: "row",
      });
    });
  });

  describe("failure tracking functions", () => {
    beforeEach(() => {
      localStorageMock.pingo_analytics_consent = "granted";
    });

    it("trackImageUploadFailed should send correct event", () => {
      trackImageUploadFailed("game123", "storage_upload", "Network error");
      expect(gtagMock).toHaveBeenCalledWith("event", "image_upload_failed", {
        game_id: "game123",
        failure_phase: "storage_upload",
        error_message: "Network error",
      });
    });

    it("trackImageRejected should send correct event with reason", () => {
      trackImageRejected("game123", "Inappropriate content");
      expect(gtagMock).toHaveBeenCalledWith("event", "image_rejected", {
        game_id: "game123",
        rejection_reason: "Inappropriate content",
      });
    });

    it("trackImageRejected should use 'unspecified' when no reason provided", () => {
      trackImageRejected("game123");
      expect(gtagMock).toHaveBeenCalledWith("event", "image_rejected", {
        game_id: "game123",
        rejection_reason: "unspecified",
      });
    });

    it("trackGeminiAnalysisFailed should send correct event", () => {
      trackGeminiAnalysisFailed("game123", "timeout", "Request timeout");
      expect(gtagMock).toHaveBeenCalledWith("event", "gemini_analysis_failed", {
        game_id: "game123",
        error_type: "timeout",
        error_message: "Request timeout",
      });
    });

    it("trackImageNoMatch should send correct event", () => {
      trackImageNoMatch("game123");
      expect(gtagMock).toHaveBeenCalledWith("event", "image_no_match", {
        game_id: "game123",
      });
    });
  });
});
