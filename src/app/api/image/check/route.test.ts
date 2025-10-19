import type { DecodedIdToken } from "firebase-admin/auth";
import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminAuth } from "@/lib/firebase/admin";
import { AdminGameService } from "@/lib/firebase/admin-collections";
import type { Game } from "@/types/schema";
import { POST } from "./route";

// Mock Firebase Admin
vi.mock("@/lib/firebase/admin", () => ({
  adminAuth: {
    verifyIdToken: vi.fn(),
  },
}));

// Mock AdminGameService
vi.mock("@/lib/firebase/admin-collections", () => ({
  AdminGameService: {
    getGame: vi.fn(),
  },
}));

// Mock Google GenAI using vi.hoisted
const mockGenerateContent = vi.hoisted(() => vi.fn());
vi.mock("@google/genai", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
    })),
  };
});

describe("/api/image/check", () => {
  const mockVerifyIdToken = vi.mocked(adminAuth.verifyIdToken);
  const mockGetGame = vi.mocked(AdminGameService.getGame);

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up environment variable
    process.env.GEMINI_API_KEY = "test-api-key";

    // Mock getGame to return a game without skipImageCheck by default
    mockGetGame.mockResolvedValue({
      id: "TESTGM",
      skipImageCheck: false,
    } as Partial<Game> as Game);
  });

  const createMockRequest = (
    body: unknown,
    authHeader?: string,
  ): NextRequest => {
    const headers = new Headers();
    if (authHeader) {
      headers.set("authorization", authHeader);
    }

    return {
      headers,
      json: vi.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  };

  describe("Authentication", () => {
    it("should return 401 when authorization header is missing", async () => {
      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe("MISSING_TOKEN");
    });

    it("should return 401 when authorization header is invalid", async () => {
      const request = createMockRequest({}, "Invalid header");

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe("MISSING_TOKEN");
    });

    it("should return 401 when token verification fails", async () => {
      mockVerifyIdToken.mockRejectedValue(new Error("Invalid token"));

      const request = createMockRequest(
        {
          imageUrl: "https://storage.googleapis.com/test-bucket/test-image.jpg",
        },
        "Bearer invalid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe("INVALID_TOKEN");
    });
  });

  describe("Request validation", () => {
    beforeEach(() => {
      mockVerifyIdToken.mockResolvedValue({
        uid: "test-user-id",
      } as DecodedIdToken);
    });

    it("should return 400 when imageUrl is missing", async () => {
      const request = createMockRequest(
        { gameId: "TESTGM" },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when imageUrl is not a valid URL", async () => {
      const request = createMockRequest(
        {
          gameId: "TESTGM",
          imageUrl: "not-a-url",
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Image appropriateness checking", () => {
    beforeEach(() => {
      mockVerifyIdToken.mockResolvedValue({
        uid: "test-user-id",
      } as DecodedIdToken);

      // Mock successful fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
        headers: {
          get: vi.fn().mockReturnValue("image/jpeg"),
        },
      } as unknown as Response);
    });

    it("should return appropriate: true when image is safe", async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          ok: "This image shows a white coffee cup on a wooden desk.",
        }),
      });

      const request = createMockRequest(
        {
          gameId: "TESTGM",
          imageUrl: "https://storage.googleapis.com/test-bucket/coffee-cup.jpg",
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.appropriate).toBe(true);
      expect(data.data?.reason).toBe(
        "This image shows a white coffee cup on a wooden desk.",
      );
    });

    it("should return appropriate: false when image is inappropriate", async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          error: "This image contains inappropriate content.",
        }),
      });

      const request = createMockRequest(
        {
          gameId: "TESTGM",
          imageUrl:
            "https://storage.googleapis.com/test-bucket/inappropriate.jpg",
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.appropriate).toBe(false);
      expect(data.data?.reason).toBe(
        "This image contains inappropriate content.",
      );
    });

    it("should return 500 when AI response is invalid JSON", async () => {
      mockGenerateContent.mockResolvedValue({
        text: "Invalid JSON response",
      });

      const request = createMockRequest(
        {
          gameId: "TESTGM",
          imageUrl: "https://storage.googleapis.com/test-bucket/test-image.jpg",
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe("INVALID_RESPONSE");
    });

    it("should return 400 when image fetch fails", async () => {
      // Mock fetch to fail
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
      } as unknown as Response);

      const request = createMockRequest(
        {
          gameId: "TESTGM",
          imageUrl: "https://storage.googleapis.com/test-bucket/test-image.jpg",
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe("IMAGE_FETCH_FAILED");
    });

    it("should return 500 when AI generation fails", async () => {
      mockGenerateContent.mockRejectedValue(new Error("AI error"));

      const request = createMockRequest(
        {
          gameId: "TESTGM",
          imageUrl: "https://storage.googleapis.com/test-bucket/test-image.jpg",
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe("INTERNAL_ERROR");
    });
  });

  describe("Environment configuration", () => {
    it("should handle missing GEMINI_API_KEY gracefully", async () => {
      process.env.GEMINI_API_KEY = undefined;

      mockVerifyIdToken.mockResolvedValue({
        uid: "test-user-id",
      } as DecodedIdToken);

      // Mock successful fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
        headers: {
          get: vi.fn().mockReturnValue("image/jpeg"),
        },
      } as unknown as Response);

      mockGenerateContent.mockRejectedValue(new Error("API key error"));

      const request = createMockRequest(
        {
          gameId: "TESTGM",
          imageUrl: "https://storage.googleapis.com/test-bucket/test-image.jpg",
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe("INTERNAL_ERROR");
    });
  });

  describe("Skip image check functionality", () => {
    beforeEach(() => {
      mockVerifyIdToken.mockResolvedValue({
        uid: "test-user-id",
      } as DecodedIdToken);
    });

    it("should skip check and return appropriate: true when game has skipImageCheck enabled", async () => {
      // Mock getGame to return a game with skipImageCheck enabled
      mockGetGame.mockResolvedValue({
        id: "TESTGM",
        skipImageCheck: true,
      } as Partial<Game> as Game);

      const request = createMockRequest(
        {
          gameId: "TESTGM",
          imageUrl: "https://storage.googleapis.com/test-bucket/test-image.jpg",
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.appropriate).toBe(true);
      expect(data.data?.reason).toBe("Check skipped per game settings");

      // Verify that AI was not called
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it("should return 404 when game is not found", async () => {
      // Mock getGame to return null (game not found)
      mockGetGame.mockResolvedValue(null);

      const request = createMockRequest(
        {
          gameId: "NOTFND",
          imageUrl: "https://storage.googleapis.com/test-bucket/test-image.jpg",
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe("GAME_NOT_FOUND");
    });
  });
});
