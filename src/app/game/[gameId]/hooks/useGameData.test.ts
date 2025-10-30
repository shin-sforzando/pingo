import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/types/schema";
import { useGameData } from "./useGameData";

// Mock useAuthenticatedFetch hook
const mockAuthenticatedFetch = vi.fn();
vi.mock("@/hooks/useAuthenticatedFetch", () => ({
  useAuthenticatedFetch: () => ({
    authenticatedFetch: mockAuthenticatedFetch,
  }),
}));

// Mock useAuth context
const mockUser: User = {
  id: "user-123",
  username: "testuser",
  createdAt: new Date(),
  lastLoginAt: new Date(),
  updatedAt: null,
  participatingGames: ["GAME01"],
  gameHistory: [],
  isTestUser: true,
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

describe("useGameData", () => {
  const mockGameId = "GAME01";

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default successful responses
    mockAuthenticatedFetch.mockImplementation((url: string) => {
      if (url === "/api/game/GAME01") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: "GAME01",
              title: "Test Game",
              theme: "Test Theme",
              requiredBingoLines: 1,
              confidenceThreshold: 0.8,
              status: "ACTIVE",
              expiresAt: new Date("2025-12-31"),
            },
          }),
        });
      }

      if (url.includes("/board")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              cells: [
                { id: "cell_1", subject: "Subject 1" },
                { id: "cell_2", subject: "Subject 2" },
              ],
            },
          }),
        });
      }

      if (url.includes("/playerBoard/")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              userId: mockUser.id,
              cellStates: {},
              completedLines: [],
            },
          }),
        });
      }

      if (url.includes("/participants")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: [
              { id: "user-1", username: "User 1" },
              { id: "user-2", username: "User 2" },
            ],
          }),
        });
      }

      if (url.includes("/submission")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: [
              {
                id: "sub-1",
                imageUrl: "https://example.com/image.jpg",
                confidence: 0.9,
              },
            ],
          }),
        });
      }

      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });
  });

  describe("initial state", () => {
    it("should start with loading state", () => {
      const { result } = renderHook(() => useGameData(mockGameId));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.game).toBeNull();
      expect(result.current.gameBoard).toBeNull();
      expect(result.current.playerBoard).toBeNull();
      expect(result.current.participants).toEqual([]);
      expect(result.current.submissions).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.isUploading).toBe(false);
    });
  });

  describe("data loading", () => {
    it("should load game data successfully", async () => {
      const { result } = renderHook(() => useGameData(mockGameId));

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 3000 },
      );

      expect(result.current.game).not.toBeNull();
      expect(result.current.game?.title).toBe("Test Game");
      expect(result.current.gameBoard).not.toBeNull();
      expect(result.current.playerBoard).not.toBeNull();
      expect(result.current.participants.length).toBeGreaterThan(0);
      expect(result.current.submissions.length).toBeGreaterThan(0);
      expect(result.current.error).toBeNull();
    });

    it("should handle game load errors", async () => {
      mockAuthenticatedFetch.mockRejectedValueOnce(
        new Error("Failed to load game"),
      );

      const { result } = renderHook(() => useGameData(mockGameId));

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 3000 },
      );

      expect(result.current.error).not.toBeNull();
      expect(result.current.game).toBeNull();
    });
  });

  describe("refresh functions", () => {
    it("should provide refreshParticipants function", async () => {
      const { result } = renderHook(() => useGameData(mockGameId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refreshParticipants).toBe("function");

      // Test refresh
      await result.current.refreshParticipants();

      expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
        `/api/game/${mockGameId}/participants`,
      );
    });

    it("should provide refreshSubmissions function", async () => {
      const { result } = renderHook(() => useGameData(mockGameId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refreshSubmissions).toBe("function");

      // Test refresh
      await result.current.refreshSubmissions();

      expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
        expect.stringContaining("/submission"),
      );
    });
  });

  describe("setIsUploading", () => {
    it("should update isUploading state", async () => {
      const { result } = renderHook(() => useGameData(mockGameId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isUploading).toBe(false);

      result.current.setIsUploading(true);

      await waitFor(() => {
        expect(result.current.isUploading).toBe(true);
      });

      result.current.setIsUploading(false);

      await waitFor(() => {
        expect(result.current.isUploading).toBe(false);
      });
    });
  });
});
