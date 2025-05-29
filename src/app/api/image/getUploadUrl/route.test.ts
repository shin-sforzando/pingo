import { adminAuth } from "@/lib/firebase/admin";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

// Mock Firebase Admin
vi.mock("@/lib/firebase/admin", () => ({
  adminAuth: {
    verifyIdToken: vi.fn(),
  },
}));

vi.mock("firebase-admin/storage", () => ({
  getStorage: vi.fn(),
}));

vi.mock("ulid", () => ({
  ulid: vi.fn(() => "01234567890123456789012345"),
}));

describe("/api/image/getUploadUrl", () => {
  const mockVerifyIdToken = vi.mocked(adminAuth.verifyIdToken);
  const mockGetStorage = vi.mocked(getStorage);

  beforeEach(() => {
    vi.clearAllMocks();
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
      mockVerifyIdToken.mockRejectedValue(new Error("Invalid token"));

      const request = createMockRequest(
        {
          gameId: "TEST01",
          fileName: "test.jpg",
          contentType: "image/jpeg",
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
        uid: "test-user-id",
      } as DecodedIdToken);
    });

    it("should return 400 when gameId is missing", async () => {
      const request = createMockRequest(
        {
          fileName: "test.jpg",
          contentType: "image/jpeg",
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request data");
    });

    it("should return 400 when fileName is missing", async () => {
      const request = createMockRequest(
        {
          gameId: "TEST01",
          contentType: "image/jpeg",
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request data");
    });

    it("should return 400 when contentType is missing", async () => {
      const request = createMockRequest(
        {
          gameId: "TEST01",
          fileName: "test.jpg",
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request data");
    });

    it("should return 400 when contentType is unsupported", async () => {
      const request = createMockRequest(
        {
          gameId: "TEST01",
          fileName: "test.gif",
          contentType: "image/gif",
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Unsupported content type");
    });
  });

  describe("Successful upload URL generation", () => {
    beforeEach(() => {
      mockVerifyIdToken.mockResolvedValue({
        uid: "test-user-id",
      } as DecodedIdToken);

      const mockFile = {
        getSignedUrl: vi
          .fn()
          .mockResolvedValue(["https://storage.googleapis.com/signed-url"]),
      };

      const mockBucket = {
        file: vi.fn().mockReturnValue(mockFile),
      };

      mockGetStorage.mockReturnValue({
        bucket: vi.fn().mockReturnValue(mockBucket),
      } as unknown as ReturnType<typeof getStorage>);
    });

    it("should generate signed URL for JPEG image", async () => {
      const request = createMockRequest(
        {
          gameId: "TEST01",
          fileName: "test.jpg",
          contentType: "image/jpeg",
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.signedUrl).toBe("https://storage.googleapis.com/signed-url");
      expect(data.filePath).toBe(
        "TEST01/test-user-id_01234567890123456789012345.jpg",
      );
      expect(data.submissionId).toBe("01234567890123456789012345");
      expect(data.expiresAt).toBeDefined();
    });

    it("should generate signed URL for PNG image", async () => {
      const request = createMockRequest(
        {
          gameId: "TEST01",
          fileName: "test.png",
          contentType: "image/png",
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.signedUrl).toBe("https://storage.googleapis.com/signed-url");
      expect(data.filePath).toBe(
        "TEST01/test-user-id_01234567890123456789012345.jpg",
      );
    });

    it("should generate signed URL for HEIC image", async () => {
      const request = createMockRequest(
        {
          gameId: "TEST01",
          fileName: "test.heic",
          contentType: "image/heic",
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.signedUrl).toBe("https://storage.googleapis.com/signed-url");
      expect(data.filePath).toBe(
        "TEST01/test-user-id_01234567890123456789012345.jpg",
      );
    });

    it("should generate signed URL for WebP image", async () => {
      const request = createMockRequest(
        {
          gameId: "TEST01",
          fileName: "test.webp",
          contentType: "image/webp",
        },
        "Bearer valid-token",
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.signedUrl).toBe("https://storage.googleapis.com/signed-url");
      expect(data.filePath).toBe(
        "TEST01/test-user-id_01234567890123456789012345.jpg",
      );
    });
  });

  describe("Error handling", () => {
    beforeEach(() => {
      mockVerifyIdToken.mockResolvedValue({
        uid: "test-user-id",
      } as DecodedIdToken);
    });

    it("should return 500 when storage operation fails", async () => {
      mockGetStorage.mockImplementation(() => {
        throw new Error("Storage error");
      });

      const request = createMockRequest(
        {
          gameId: "TEST01",
          fileName: "test.jpg",
          contentType: "image/jpeg",
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
