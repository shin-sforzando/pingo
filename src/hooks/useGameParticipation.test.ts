import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/types/schema";
import { useGameParticipation } from "./useGameParticipation";

// Mock useAuthenticatedFetch hook
const mockAuthenticatedFetch = vi.fn();
vi.mock("./useAuthenticatedFetch", () => ({
  useAuthenticatedFetch: () => ({
    authenticatedFetch: mockAuthenticatedFetch,
  }),
}));

describe("useGameParticipation", () => {
  const mockGameId = "GAME01";
  const mockUser: User = {
    id: "user-123",
    username: "testuser",
    createdAt: new Date(),
    lastLoginAt: new Date(),
    updatedAt: null,
    participatingGames: [],
    gameHistory: [],
    isTestUser: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should start with loading state", async () => {
      mockAuthenticatedFetch.mockImplementation(
        () =>
          new Promise(() => {
            // Never resolve to keep loading state
          }),
      );

      const { result } = renderHook(() =>
        useGameParticipation(mockGameId, mockUser),
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isParticipating).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe("with authenticated user", () => {
    it("should check participation and return true when user is participating", async () => {
      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            { id: "other-user", username: "otheruser" },
            { id: mockUser.id, username: mockUser.username },
          ],
        }),
      });

      const { result } = renderHook(() =>
        useGameParticipation(mockGameId, mockUser),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isParticipating).toBe(true);
      expect(result.current.error).toBeNull();
      expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
        `/api/game/${mockGameId}/participants`,
      );
    });

    it("should check participation and return false when user is not participating", async () => {
      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            { id: "other-user-1", username: "user1" },
            { id: "other-user-2", username: "user2" },
          ],
        }),
      });

      const { result } = renderHook(() =>
        useGameParticipation(mockGameId, mockUser),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isParticipating).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should return false when participants list is empty", async () => {
      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      const { result } = renderHook(() =>
        useGameParticipation(mockGameId, mockUser),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isParticipating).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should return false when API response is not ok", async () => {
      mockAuthenticatedFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { code: "NOT_FOUND", message: "Game not found" },
        }),
      });

      const { result } = renderHook(() =>
        useGameParticipation(mockGameId, mockUser),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isParticipating).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should return false when API response success is false", async () => {
      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "Internal error" },
        }),
      });

      const { result } = renderHook(() =>
        useGameParticipation(mockGameId, mockUser),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isParticipating).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should handle network errors and set error state", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const networkError = new Error("Network error");
      mockAuthenticatedFetch.mockRejectedValue(networkError);

      const { result } = renderHook(() =>
        useGameParticipation(mockGameId, mockUser),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isParticipating).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toContain("Network error");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("without authenticated user", () => {
    it("should return false immediately when user is null", async () => {
      const { result } = renderHook(() =>
        useGameParticipation(mockGameId, null),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isParticipating).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockAuthenticatedFetch).not.toHaveBeenCalled();
    });
  });

  describe("refresh functionality", () => {
    it("should provide refresh function to re-check participation", async () => {
      // First call: user not participating
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ id: "other-user", username: "otheruser" }],
        }),
      });

      const { result } = renderHook(() =>
        useGameParticipation(mockGameId, mockUser),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isParticipating).toBe(false);

      // Second call after refresh: user now participating
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            { id: "other-user", username: "otheruser" },
            { id: mockUser.id, username: mockUser.username },
          ],
        }),
      });

      await result.current.refresh();

      await waitFor(() => {
        expect(result.current.isParticipating).toBe(true);
      });

      expect(mockAuthenticatedFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("gameId and user changes", () => {
    it("should re-check participation when user changes", async () => {
      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      const { result, rerender } = renderHook(
        ({ gameId, user }) => useGameParticipation(gameId, user),
        {
          initialProps: { gameId: mockGameId, user: mockUser },
        },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockAuthenticatedFetch).toHaveBeenCalledTimes(1);

      // Change user
      const newUser: User = {
        ...mockUser,
        id: "user-456",
        username: "newuser",
      };

      rerender({ gameId: mockGameId, user: newUser });

      await waitFor(() => {
        expect(mockAuthenticatedFetch).toHaveBeenCalledTimes(2);
      });
    });

    it("should re-check participation when gameId changes", async () => {
      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      const { result, rerender } = renderHook(
        ({ gameId, user }) => useGameParticipation(gameId, user),
        {
          initialProps: { gameId: mockGameId, user: mockUser },
        },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockAuthenticatedFetch).toHaveBeenCalledTimes(1);

      // Change gameId
      const newGameId = "GAME02";
      rerender({ gameId: newGameId, user: mockUser });

      await waitFor(() => {
        expect(mockAuthenticatedFetch).toHaveBeenCalledTimes(2);
      });

      expect(mockAuthenticatedFetch).toHaveBeenLastCalledWith(
        `/api/game/${newGameId}/participants`,
      );
    });
  });
});
