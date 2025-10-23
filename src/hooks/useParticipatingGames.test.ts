import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/types/schema";
import { useParticipatingGames } from "./useParticipatingGames";

// Mock AuthContext (not used by this hook but imported by dependencies)
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    refreshUser: vi.fn(),
  }),
}));

// Mock Firebase auth
const mockGetIdToken = vi.fn();
vi.mock("@/lib/firebase/client", () => ({
  auth: {
    currentUser: {
      getIdToken: () => mockGetIdToken(),
    },
  },
}));

// Mock global fetch
global.fetch = vi.fn();

describe("useParticipatingGames", () => {
  const mockIdToken = "mock-id-token-123";
  const mockUser: User = {
    id: "user-123",
    username: "testuser",
    participatingGames: ["GAME01", "GAME02"],
    gameHistory: [],
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: null,
    isTestUser: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetIdToken.mockResolvedValue(mockIdToken);
  });

  describe("initial state", () => {
    it("should start with loading state", () => {
      const { result } = renderHook(() => useParticipatingGames(mockUser));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.participatingGames).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe("user is null", () => {
    it("should return empty array when user is null", async () => {
      const { result } = renderHook(() => useParticipatingGames(null));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.participatingGames).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe("user has no participating games", () => {
    it("should return empty array when participatingGames is empty", async () => {
      const userWithNoGames: User = {
        ...mockUser,
        participatingGames: [],
      };

      const { result } = renderHook(() =>
        useParticipatingGames(userWithNoGames),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.participatingGames).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe("successful game fetch with details", () => {
    it("should fetch game details and participant count", async () => {
      const mockGameResponse = {
        success: true,
        data: {
          id: "GAME01",
          title: "Summer Adventure",
          theme: "Beach activities",
          notes: "Family friendly",
          createdAt: "2024-01-01T00:00:00.000Z",
          expiresAt: "2099-12-31T23:59:59.999Z", // Future date
        },
      };

      const mockParticipantsResponse = {
        success: true,
        data: [{ userId: "user-1" }, { userId: "user-2" }],
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGameResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockParticipantsResponse,
        });

      const userWithOneGame: User = {
        ...mockUser,
        participatingGames: ["GAME01"],
      };

      const { result } = renderHook(() =>
        useParticipatingGames(userWithOneGame, { fetchDetails: true }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.participatingGames).toHaveLength(1);
      expect(result.current.participatingGames[0]).toEqual({
        id: "GAME01",
        title: "Summer Adventure",
        theme: "Beach activities",
        notes: "Family friendly",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        expiresAt: new Date("2099-12-31T23:59:59.999Z"),
        participantCount: 2,
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(1, "/api/game/GAME01", {
        headers: {
          Authorization: `Bearer ${mockIdToken}`,
        },
      });
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        "/api/game/GAME01/participants",
        {
          headers: {
            Authorization: `Bearer ${mockIdToken}`,
          },
        },
      );
    });
  });

  describe("successful game fetch without details", () => {
    it("should fetch only basic game info when fetchDetails is false", async () => {
      const mockGameResponse = {
        success: true,
        data: {
          id: "GAME01",
          title: "Summer Adventure",
          theme: "Beach activities",
          notes: "Family friendly",
          createdAt: "2024-01-01T00:00:00.000Z",
          expiresAt: "2099-12-31T23:59:59.999Z",
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGameResponse,
      });

      const userWithOneGame: User = {
        ...mockUser,
        participatingGames: ["GAME01"],
      };

      const { result } = renderHook(() =>
        useParticipatingGames(userWithOneGame, { fetchDetails: false }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.participatingGames).toHaveLength(1);
      expect(result.current.participatingGames[0]).toEqual({
        id: "GAME01",
        title: "Summer Adventure",
        theme: "",
        participantCount: 0,
        createdAt: null,
        expiresAt: null,
        // No notes field when fetchDetails is false
      });

      // Should only call game API, not participants API
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("expired game filtering", () => {
    it("should filter out expired games", async () => {
      const expiredGameResponse = {
        success: true,
        data: {
          id: "GAME01",
          title: "Expired Game",
          expiresAt: "2020-01-01T00:00:00.000Z", // Past date
        },
      };

      const activeGameResponse = {
        success: true,
        data: {
          id: "GAME02",
          title: "Active Game",
          expiresAt: "2099-12-31T23:59:59.999Z", // Future date
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => expiredGameResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => activeGameResponse,
        });

      const { result } = renderHook(() =>
        useParticipatingGames(mockUser, { fetchDetails: false }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should only include active game
      expect(result.current.participatingGames).toHaveLength(1);
      expect(result.current.participatingGames[0].id).toBe("GAME02");
    });

    it("should include games with null expiresAt", async () => {
      const gameWithNoExpiry = {
        success: true,
        data: {
          id: "GAME01",
          title: "No Expiry Game",
          expiresAt: null,
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => gameWithNoExpiry,
      });

      const userWithOneGame: User = {
        ...mockUser,
        participatingGames: ["GAME01"],
      };

      const { result } = renderHook(() =>
        useParticipatingGames(userWithOneGame, { fetchDetails: false }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.participatingGames).toHaveLength(1);
      expect(result.current.participatingGames[0].id).toBe("GAME01");
    });
  });

  describe("error handling", () => {
    it("should silently skip games that return 404", async () => {
      const successResponse = {
        success: true,
        data: {
          id: "GAME02",
          title: "Active Game",
          expiresAt: "2099-12-31T23:59:59.999Z",
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => successResponse,
        });

      const { result } = renderHook(() =>
        useParticipatingGames(mockUser, { fetchDetails: false }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should only include the successful game
      expect(result.current.participatingGames).toHaveLength(1);
      expect(result.current.participatingGames[0].id).toBe("GAME02");
      expect(result.current.error).toBeNull(); // Should not set error for 404
    });

    it("should handle token retrieval errors gracefully", async () => {
      // Token retrieval error will cause the whole effect to fail
      mockGetIdToken.mockRejectedValue(new Error("Token retrieval failed"));

      const userWithOneGame: User = {
        ...mockUser,
        participatingGames: ["GAME01"],
      };

      const { result } = renderHook(() =>
        useParticipatingGames(userWithOneGame, { fetchDetails: false }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.participatingGames).toEqual([]);
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toContain("Token retrieval failed");
    });

    it("should silently fail participant count fetch", async () => {
      const mockGameResponse = {
        success: true,
        data: {
          id: "GAME01",
          title: "Game with failing participants",
          expiresAt: "2099-12-31T23:59:59.999Z",
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGameResponse,
        })
        .mockRejectedValueOnce(new Error("Participant fetch failed"));

      const userWithOneGame: User = {
        ...mockUser,
        participatingGames: ["GAME01"],
      };

      const { result } = renderHook(() =>
        useParticipatingGames(userWithOneGame, { fetchDetails: true }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should still include game with default participant count (0) when fetch fails
      expect(result.current.participatingGames).toHaveLength(1);
      expect(result.current.participatingGames[0].id).toBe("GAME01");
      expect(result.current.participatingGames[0].participantCount).toBe(0);
      expect(result.current.error).toBeNull(); // Should not set error for participant fetch failure
    });
  });

  describe("dependency optimization", () => {
    it("should only re-fetch when user ID or game IDs change", async () => {
      const mockGameResponse = {
        success: true,
        data: {
          id: "GAME01",
          title: "Test Game",
          expiresAt: "2099-12-31T23:59:59.999Z",
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockGameResponse,
      });

      const userWithOneGame: User = {
        ...mockUser,
        participatingGames: ["GAME01"],
      };

      const { result, rerender } = renderHook(
        ({ user }) => useParticipatingGames(user, { fetchDetails: false }),
        {
          initialProps: { user: userWithOneGame },
        },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const fetchCountAfterInitialRender = (
        global.fetch as ReturnType<typeof vi.fn>
      ).mock.calls.length;

      // Re-render with same user (but different object reference)
      const sameUserNewReference: User = {
        ...userWithOneGame,
      };
      rerender({ user: sameUserNewReference });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should NOT trigger new fetch (user ID and game IDs are the same)
      expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(
        fetchCountAfterInitialRender,
      );
    });

    it("should re-fetch when participating games list changes", async () => {
      const mockGameResponse = {
        success: true,
        data: {
          id: "GAME01",
          title: "Test Game",
          expiresAt: "2099-12-31T23:59:59.999Z",
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockGameResponse,
      });

      const userWithOneGame: User = {
        ...mockUser,
        participatingGames: ["GAME01"],
      };

      const { result, rerender } = renderHook(
        ({ user }) => useParticipatingGames(user, { fetchDetails: false }),
        {
          initialProps: { user: userWithOneGame },
        },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const fetchCountAfterInitialRender = (
        global.fetch as ReturnType<typeof vi.fn>
      ).mock.calls.length;

      // Re-render with different game list
      const userWithTwoGames: User = {
        ...mockUser,
        participatingGames: ["GAME01", "GAME02"],
      };
      rerender({ user: userWithTwoGames });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should trigger new fetch (game IDs changed)
      expect(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length,
      ).toBeGreaterThan(fetchCountAfterInitialRender);
    });
  });

  describe("token retrieval failure", () => {
    it("should return empty array when unable to get ID token", async () => {
      mockGetIdToken.mockResolvedValue(null);

      const userWithOneGame: User = {
        ...mockUser,
        participatingGames: ["GAME01"],
      };

      const { result } = renderHook(() =>
        useParticipatingGames(userWithOneGame, { fetchDetails: false }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.participatingGames).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
