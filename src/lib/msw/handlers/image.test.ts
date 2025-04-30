import { ulid } from "ulid";
import { beforeAll, describe, expect, it } from "vitest";

describe("MSW Image Handlers (/api/images/*)", () => {
  const testApiBase = "/api/images";
  let mockImageUrl: string;

  // --- POST /api/images/getUploadUrl ---
  describe("POST /getUploadUrl", () => {
    it("should generate a signed URL for image upload", async () => {
      const uploadRequest = {
        filename: "test-image.jpg",
        contentType: "image/jpeg",
        gameId: "ABCDEF", // Valid game ID format
      };

      const response = await fetch(`${testApiBase}/getUploadUrl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadRequest),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.uploadUrl).toBeDefined();
      expect(data.imageUrl).toBeDefined();
      expect(typeof data.uploadUrl).toBe("string");
      expect(typeof data.imageUrl).toBe("string");
      expect(data.uploadUrl).toContain(uploadRequest.gameId);
      expect(data.imageUrl).toContain(uploadRequest.gameId);

      // Store for later tests
      mockImageUrl = data.imageUrl;
    });

    it("should return 400 for invalid filename", async () => {
      const invalidRequest = {
        filename: "", // Empty filename
        contentType: "image/jpeg",
        gameId: "ABCDEF",
      };

      const response = await fetch(`${testApiBase}/getUploadUrl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidRequest),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Invalid request body for upload URL");
      expect(data.errors).toBeDefined();
    });

    it("should return 400 for invalid content type", async () => {
      const invalidRequest = {
        filename: "test.txt",
        contentType: "text/plain", // Not an image type
        gameId: "ABCDEF",
      };

      const response = await fetch(`${testApiBase}/getUploadUrl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidRequest),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Invalid request body for upload URL");
      expect(data.errors).toBeDefined();
    });

    it("should return 400 for invalid game ID", async () => {
      const invalidRequest = {
        filename: "test.jpg",
        contentType: "image/jpeg",
        gameId: "invalid", // Invalid game ID format
      };

      const response = await fetch(`${testApiBase}/getUploadUrl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidRequest),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Invalid request body for upload URL");
      expect(data.errors).toBeDefined();
    });
  });

  // --- POST /api/images/process ---
  describe("POST /process", () => {
    beforeAll(async () => {
      // Ensure we have a mock image URL to use
      if (!mockImageUrl) {
        const uploadRequest = {
          filename: "test-image.jpg",
          contentType: "image/jpeg",
          gameId: "ABCDEF",
        };

        const response = await fetch(`${testApiBase}/getUploadUrl`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(uploadRequest),
        });

        const data = await response.json();
        mockImageUrl = data.imageUrl;
      }
    });

    it("should process an image successfully", async () => {
      const processRequest = {
        imageUrl: mockImageUrl,
        gameId: "ABCDEF",
        userId: "mockuser1",
        submissionId: ulid(),
      };

      const response = await fetch(`${testApiBase}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processRequest),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.submissionId).toBe(processRequest.submissionId);
      expect(data.processingStatus).toBeDefined();
      expect(data.acceptanceStatus).toBeDefined();
      // These may be null depending on the mock implementation
      expect("matchedCellId" in data).toBe(true);
      expect("confidence" in data).toBe(true);
    });

    it("should reject inappropriate content", async () => {
      const processRequest = {
        imageUrl: "gs://pingo-images/ABCDEF/bad-content-image.jpg", // Contains "bad" to trigger mock rejection
        gameId: "ABCDEF",
        userId: "mockuser1",
        submissionId: ulid(),
      };

      const response = await fetch(`${testApiBase}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processRequest),
      });

      expect(response.status).toBe(200); // Still 200 as the processing succeeded, just with rejection
      const data = await response.json();

      expect(data.submissionId).toBe(processRequest.submissionId);
      expect(data.processingStatus).toBe("error");
      expect(data.acceptanceStatus).toBe("inappropriate_content");
      expect(data.errorMessage).toBeDefined();
      expect(data.matchedCellId).toBeNull();
      expect(data.confidence).toBeNull();
    });

    it("should return 400 for invalid request data", async () => {
      const invalidRequest = {
        // Missing required fields
        gameId: "ABCDEF",
      };

      const response = await fetch(`${testApiBase}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidRequest),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Invalid image processing request body");
      expect(data.errors).toBeDefined();
    });

    it("should return 400 for invalid ULID format", async () => {
      const invalidRequest = {
        imageUrl: mockImageUrl,
        gameId: "ABCDEF",
        userId: "mockuser1",
        submissionId: "invalid-ulid", // Invalid ULID format
      };

      const response = await fetch(`${testApiBase}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidRequest),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Invalid image processing request body");
      expect(data.errors).toBeDefined();
    });
  });
});
