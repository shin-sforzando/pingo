import { adminAuth } from "@/lib/firebase/admin";
import {
  AdminGameBoardService,
  AdminGameService,
  AdminSubmissionService,
} from "@/lib/firebase/admin-collections";
import { GameStatus } from "@/types/common";
import { faker } from "@faker-js/faker";
import type { DecodedIdToken } from "firebase-admin/auth";
import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

// Mock Firebase Admin
vi.mock("@/lib/firebase/admin", () => ({
  adminAuth: {
    verifyIdToken: vi.fn(),
  },
}));

// Mock Admin Services
vi.mock("@/lib/firebase/admin-collections", () => ({
  AdminGameService: {
    getGame: vi.fn(),
  },
  AdminGameBoardService: {
    getGameBoard: vi.fn(),
  },
  AdminPlayerBoardService: {
    getPlayerBoard: vi.fn(),
    updatePlayerBoard: vi.fn(),
  },
  AdminSubmissionService: {
    createSubmission: vi.fn(),
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

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up environment variable
    process.env.GEMINI_API_KEY = "test-api-key";
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
      expect(data.error).toBe("Authorization header required");
    });

    it("should return 401 when authorization header is invalid", async () => {
      const request = createMockRequest({}, "Invalid header");

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Authorization header required");
    });

    it("should return 401 when token verification fails", async () => {
      const authError = new Error("Invalid token");
      authError.message = "auth error"; // Make sure error message includes "auth"
      mockVerifyIdToken.mockRejectedValue(authError);

      const request = createMockRequest(
        {
          imageUrl: "https://storage.googleapis.com/test-bucket/test-image.jpg",
        },
        "Bearer invalid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication failed");
    });
  });

  describe("Request validation", () => {
    beforeEach(() => {
      mockVerifyIdToken.mockResolvedValue({
        uid: faker.string.ulid(),
      } as DecodedIdToken);
    });

    it("should return 400 when required fields are missing", async () => {
      const request = createMockRequest({}, "Bearer valid-token");

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request data");
    });

    it("should return 400 when imageUrl is not a valid URL", async () => {
      const request = createMockRequest(
        {
          gameId: "TEST01",
          imageUrl: "not-a-url",
          submissionId: faker.string.ulid(),
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request data");
    });
  });

  describe("Image content checking", () => {
    beforeEach(() => {
      mockVerifyIdToken.mockResolvedValue({
        uid: faker.string.ulid(),
      } as DecodedIdToken);

      // Mock Admin Services
      vi.mocked(AdminGameService.getGame).mockResolvedValue({
        id: "TEST01",
        title: "Test Game",
        theme: "Test Theme",
        creatorId: faker.string.ulid(),
        confidenceThreshold: 0.7,
        maxSubmissionsPerUser: 30,
        requiredBingoLines: 1,
        isPublic: false,
        isPhotoSharingEnabled: true,
        status: GameStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
      });

      vi.mocked(AdminGameBoardService.getGameBoard).mockResolvedValue({
        cells: [
          {
            id: "cell-1",
            position: { x: 0, y: 0 },
            subject: "Coffee Cup",
            isFree: false,
          },
        ],
      });

      vi.mocked(AdminSubmissionService.createSubmission).mockResolvedValue();

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
      // Mock appropriateness check
      mockGenerateContent
        .mockResolvedValueOnce({
          text: JSON.stringify({
            ok: "This image shows a white coffee cup on a wooden desk.",
          }),
        })
        // Mock analysis check
        .mockResolvedValueOnce({
          text: JSON.stringify({
            description: "A white coffee cup on a wooden desk",
            matchedCellId: "cell-1",
            confidence: 0.85,
            reasoning:
              "The image clearly shows a coffee cup which matches the cell subject.",
          }),
        });

      const request = createMockRequest(
        {
          gameId: "TEST01",
          imageUrl: "https://storage.googleapis.com/test-bucket/coffee-cup.jpg",
          submissionId: faker.string.ulid(),
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.appropriate).toBe(true);
      expect(data.confidence).toBe(0.85);
      expect(data.matchedCellId).toBe("cell-1");
      expect(data.acceptanceStatus).toBe("accepted");
    });

    it("should return appropriate: false when image is inappropriate", async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          error: "This image contains sexual expressions.",
        }),
      });

      const request = createMockRequest(
        {
          gameId: "TEST01",
          imageUrl:
            "https://storage.googleapis.com/test-bucket/inappropriate.jpg",
          submissionId: faker.string.ulid(),
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.appropriate).toBe(false);
      expect(data.reason).toBe("This image contains sexual expressions.");
    });

    it("should return 500 when AI response is invalid JSON", async () => {
      mockGenerateContent.mockResolvedValue({
        text: "Invalid JSON response",
      });

      const request = createMockRequest(
        {
          gameId: "TEST01",
          imageUrl: "https://storage.googleapis.com/test-bucket/test-image.jpg",
          submissionId: faker.string.ulid(),
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Invalid response from AI service");
    });

    it("should return 400 when image fetch fails", async () => {
      // Mock fetch to fail
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
      } as unknown as Response);

      const request = createMockRequest(
        {
          gameId: "TEST01",
          imageUrl: "https://storage.googleapis.com/test-bucket/test-image.jpg",
          submissionId: faker.string.ulid(),
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Failed to fetch image");
    });

    it("should return 500 when AI generation fails", async () => {
      mockGenerateContent.mockRejectedValue(new Error("AI error"));

      const request = createMockRequest(
        {
          gameId: "TEST01",
          imageUrl: "https://storage.googleapis.com/test-bucket/test-image.jpg",
          submissionId: faker.string.ulid(),
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
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
          gameId: "TEST01",
          imageUrl: "https://storage.googleapis.com/test-bucket/test-image.jpg",
          submissionId: faker.string.ulid(),
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});
