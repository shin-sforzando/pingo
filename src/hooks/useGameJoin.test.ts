import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGameJoin } from "./useGameJoin";

// Mock AuthContext
const mockRefreshUser = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    refreshUser: mockRefreshUser,
  }),
}));

// Mock useAuthenticatedFetch hook
const mockAuthenticatedFetch = vi.fn();
vi.mock("./useAuthenticatedFetch", () => ({
  useAuthenticatedFetch: () => ({
    authenticatedFetch: mockAuthenticatedFetch,
  }),
}));

describe("useGameJoin", () => {
  const mockGameId = "GAME01";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const { result } = renderHook(() => useGameJoin());

      expect(result.current.isJoining).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.joinGame).toBe("function");
      expect(typeof result.current.clearError).toBe("function");
    });
  });

  describe("successful game join", () => {
    it("should join game successfully and return success result", async () => {
      const mockResponse = {
        success: true,
        data: {
          participationId: "participation-123",
        },
      };

      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });
      mockRefreshUser.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGameJoin());

      const joinResult = await result.current.joinGame(mockGameId);

      expect(joinResult).toEqual(mockResponse);
      expect(result.current.isJoining).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
        `/api/game/${mockGameId}/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      expect(mockRefreshUser).toHaveBeenCalledTimes(1);
    });

    it("should handle already participating response", async () => {
      const mockResponse = {
        success: true,
        data: {
          participationId: "participation-123",
          alreadyParticipating: true,
        },
      };

      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });
      mockRefreshUser.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGameJoin());

      const joinResult = await result.current.joinGame(mockGameId);

      expect(joinResult).toEqual(mockResponse);
      expect(result.current.error).toBeNull();
      expect(mockRefreshUser).toHaveBeenCalledTimes(1);
    });

    it("should succeed even if refreshUser fails", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const mockResponse = {
        success: true,
        data: {
          participationId: "participation-123",
        },
      };

      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });
      mockRefreshUser.mockRejectedValue(new Error("Refresh failed"));

      const { result } = renderHook(() => useGameJoin());

      const joinResult = await result.current.joinGame(mockGameId);

      // Join should still succeed even if refresh fails
      expect(joinResult).toEqual(mockResponse);
      expect(result.current.error).toBeNull();
      expect(mockRefreshUser).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to refresh user after game join:",
        new Error("Refresh failed"),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("error handling", () => {
    it("should handle HTTP error responses (not ok)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "GAME_NOT_FOUND",
          message: "Game not found",
        },
      };

      mockAuthenticatedFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useGameJoin());

      const joinResult = await result.current.joinGame(mockGameId);

      expect(joinResult).toEqual({
        success: false,
        error: mockResponse.error,
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Game not found");
      });
      expect(result.current.isJoining).toBe(false);
    });

    it("should handle API error responses (ok but success false)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "ALREADY_JOINED",
          message: "Already joined this game",
        },
      };

      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useGameJoin());

      const joinResult = await result.current.joinGame(mockGameId);

      expect(joinResult).toEqual({
        success: false,
        error: mockResponse.error,
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Already joined this game");
      });
    });

    it("should handle network errors", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const networkError = new Error("Network connection failed");

      mockAuthenticatedFetch.mockRejectedValue(networkError);

      const { result } = renderHook(() => useGameJoin());

      const joinResult = await result.current.joinGame(mockGameId);

      expect(joinResult).toEqual({
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: "Network connection failed",
        },
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Network connection failed");
      });
      expect(result.current.isJoining).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error joining game:",
        networkError,
      );

      consoleSpy.mockRestore();
    });

    it("should handle errors without error message in response", async () => {
      mockAuthenticatedFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
        }),
      });

      const { result } = renderHook(() => useGameJoin());

      const joinResult = await result.current.joinGame(mockGameId);

      expect(joinResult).toEqual({
        success: false,
        error: {
          code: "JOIN_FAILED",
          message: "Failed to join game",
        },
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to join game");
      });
    });

    it("should handle non-Error exceptions", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockAuthenticatedFetch.mockRejectedValue("Unknown error");

      const { result } = renderHook(() => useGameJoin());

      const joinResult = await result.current.joinGame(mockGameId);

      expect(joinResult).toEqual({
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: "Failed to join game",
        },
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to join game");
      });

      consoleSpy.mockRestore();
    });
  });

  describe("clearError functionality", () => {
    it("should clear error state", async () => {
      mockAuthenticatedFetch.mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: {
            code: "ERROR",
            message: "Some error",
          },
        }),
      });

      const { result } = renderHook(() => useGameJoin());

      // Trigger an error
      await result.current.joinGame(mockGameId);

      await waitFor(() => {
        expect(result.current.error).toBe("Some error");
      });

      // Clear the error
      result.current.clearError();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe("state management", () => {
    it("should clear error when starting new join attempt", async () => {
      // First call fails
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: {
            code: "ERROR",
            message: "First error",
          },
        }),
      });

      const { result } = renderHook(() => useGameJoin());

      await result.current.joinGame(mockGameId);

      await waitFor(() => {
        expect(result.current.error).toBe("First error");
      });
      // refreshUser should not be called on failure
      expect(mockRefreshUser).not.toHaveBeenCalled();

      // Second call succeeds
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            participationId: "123",
          },
        }),
      });
      mockRefreshUser.mockResolvedValue(undefined);

      await result.current.joinGame(mockGameId);

      await waitFor(() => {
        // Error should be cleared
        expect(result.current.error).toBeNull();
      });
      // refreshUser should be called on success
      expect(mockRefreshUser).toHaveBeenCalledTimes(1);
    });
  });

  describe("function stability", () => {
    it("should return stable function references across renders", () => {
      const { result, rerender } = renderHook(() => useGameJoin());

      const firstJoinGame = result.current.joinGame;
      const firstClearError = result.current.clearError;

      rerender();

      expect(result.current.joinGame).toBe(firstJoinGame);
      expect(result.current.clearError).toBe(firstClearError);
    });
  });
});
