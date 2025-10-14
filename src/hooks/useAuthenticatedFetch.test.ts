import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as firebaseClient from "@/lib/firebase/client";
import { useAuthenticatedFetch } from "./useAuthenticatedFetch";

// Mock Firebase client auth
vi.mock("@/lib/firebase/client", () => ({
  auth: {
    currentUser: null,
  },
}));

describe("useAuthenticatedFetch", () => {
  const mockIdToken = "mock-id-token-123";

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup default mock for authenticated user
    vi.mocked(firebaseClient.auth).currentUser = {
      getIdToken: vi.fn().mockResolvedValue(mockIdToken),
    } as unknown as typeof firebaseClient.auth.currentUser;

    // Mock global fetch
    global.fetch = vi.fn();
  });

  describe("getAuthToken", () => {
    it("should return auth token when user is authenticated", async () => {
      const { result } = renderHook(() => useAuthenticatedFetch());

      const token = await result.current.getAuthToken();

      expect(token).toBe(mockIdToken);
      expect(firebaseClient.auth.currentUser?.getIdToken).toHaveBeenCalledTimes(
        1,
      );
    });

    it("should return null when no user is authenticated", async () => {
      vi.mocked(firebaseClient.auth).currentUser = null;

      const { result } = renderHook(() => useAuthenticatedFetch());

      const token = await result.current.getAuthToken();

      expect(token).toBeNull();
    });

    it("should return null and log error when token retrieval fails", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const mockError = new Error("Token retrieval failed");
      vi.mocked(firebaseClient.auth).currentUser = {
        getIdToken: vi.fn().mockRejectedValue(mockError),
      } as unknown as typeof firebaseClient.auth.currentUser;

      const { result } = renderHook(() => useAuthenticatedFetch());

      const token = await result.current.getAuthToken();

      expect(token).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to get authentication token:",
        mockError,
      );

      consoleSpy.mockRestore();
    });
  });

  describe("authenticatedFetch", () => {
    it("should make authenticated fetch request with authorization header", async () => {
      const mockResponse = new Response(JSON.stringify({ data: "test" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthenticatedFetch());

      const response = await result.current.authenticatedFetch("/api/test");

      expect(global.fetch).toHaveBeenCalledWith("/api/test", {
        headers: {
          Authorization: `Bearer ${mockIdToken}`,
        },
      });
      expect(response).toBe(mockResponse);
    });

    it("should merge custom headers with authorization header", async () => {
      const mockResponse = new Response(JSON.stringify({ data: "test" }), {
        status: 200,
      });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthenticatedFetch());

      await result.current.authenticatedFetch("/api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Custom-Header": "custom-value",
        },
        body: JSON.stringify({ test: "data" }),
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Custom-Header": "custom-value",
          Authorization: `Bearer ${mockIdToken}`,
        },
        body: JSON.stringify({ test: "data" }),
      });
    });

    it("should throw error when user is not authenticated", async () => {
      vi.mocked(firebaseClient.auth).currentUser = null;

      const { result } = renderHook(() => useAuthenticatedFetch());

      await expect(
        result.current.authenticatedFetch("/api/test"),
      ).rejects.toThrow("Authentication required");

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should throw error when token retrieval fails", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      vi.mocked(firebaseClient.auth).currentUser = {
        getIdToken: vi.fn().mockRejectedValue(new Error("Token error")),
      } as unknown as typeof firebaseClient.auth.currentUser;

      const { result } = renderHook(() => useAuthenticatedFetch());

      await expect(
        result.current.authenticatedFetch("/api/test"),
      ).rejects.toThrow("Authentication required");

      expect(global.fetch).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should handle fetch errors properly", async () => {
      const mockError = new Error("Network error");
      vi.mocked(global.fetch).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuthenticatedFetch());

      await expect(
        result.current.authenticatedFetch("/api/test"),
      ).rejects.toThrow("Network error");
    });

    it("should preserve fetch options like method and body", async () => {
      const mockResponse = new Response(null, { status: 201 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthenticatedFetch());

      const requestBody = { name: "test" };
      await result.current.authenticatedFetch("/api/test", {
        method: "PUT",
        body: JSON.stringify(requestBody),
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/test", {
        method: "PUT",
        body: JSON.stringify(requestBody),
        headers: {
          Authorization: `Bearer ${mockIdToken}`,
        },
      });
    });
  });

  describe("hook stability", () => {
    it("should return stable function references across renders", async () => {
      const { result, rerender } = renderHook(() => useAuthenticatedFetch());

      const firstGetAuthToken = result.current.getAuthToken;
      const firstAuthenticatedFetch = result.current.authenticatedFetch;

      rerender();

      expect(result.current.getAuthToken).toBe(firstGetAuthToken);
      expect(result.current.authenticatedFetch).toBe(firstAuthenticatedFetch);
    });
  });
});
