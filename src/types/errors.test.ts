import { describe, expect, it } from "vitest";
import {
  GeminiAnalysisError,
  ImageRejectedError,
  ImageUploadError,
} from "./errors";

describe("Custom Error Classes", () => {
  describe("ImageUploadError", () => {
    it("should create error with correct name and message", () => {
      const error = new ImageUploadError(
        "Failed to upload to storage",
        "storage_upload",
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ImageUploadError);
      expect(error.name).toBe("ImageUploadError");
      expect(error.message).toBe("Failed to upload to storage");
      expect(error.phase).toBe("storage_upload");
    });

    it("should support url_generation phase", () => {
      const error = new ImageUploadError(
        "Failed to get signed URL",
        "url_generation",
      );

      expect(error.phase).toBe("url_generation");
    });

    it("should support submission_creation phase", () => {
      const error = new ImageUploadError(
        "Failed to create submission",
        "submission_creation",
      );

      expect(error.phase).toBe("submission_creation");
    });

    it("should have proper stack trace", () => {
      const error = new ImageUploadError("Test error", "storage_upload");

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("ImageUploadError");
    });
  });

  describe("GeminiAnalysisError", () => {
    it("should create error with correct name and message", () => {
      const error = new GeminiAnalysisError("API request failed", "api_error");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(GeminiAnalysisError);
      expect(error.name).toBe("GeminiAnalysisError");
      expect(error.message).toBe("API request failed");
      expect(error.errorType).toBe("api_error");
    });

    it("should support timeout error type", () => {
      const error = new GeminiAnalysisError("Request timed out", "timeout");

      expect(error.errorType).toBe("timeout");
    });

    it("should support rate_limit error type", () => {
      const error = new GeminiAnalysisError(
        "Rate limit exceeded",
        "rate_limit",
      );

      expect(error.errorType).toBe("rate_limit");
    });

    it("should have proper stack trace", () => {
      const error = new GeminiAnalysisError("Test error", "api_error");

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("GeminiAnalysisError");
    });
  });

  describe("ImageRejectedError", () => {
    it("should create error with correct name and message", () => {
      const error = new ImageRejectedError(
        "Image contains inappropriate content",
        "Inappropriate content detected",
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ImageRejectedError);
      expect(error.name).toBe("ImageRejectedError");
      expect(error.message).toBe("Image contains inappropriate content");
      expect(error.reason).toBe("Inappropriate content detected");
    });

    it("should have proper stack trace", () => {
      const error = new ImageRejectedError("Test error", "Test reason");

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("ImageRejectedError");
    });
  });

  describe("Type discrimination with instanceof", () => {
    it("should correctly discriminate between error types", () => {
      const uploadError = new ImageUploadError(
        "Upload failed",
        "storage_upload",
      );
      const geminiError = new GeminiAnalysisError(
        "Analysis failed",
        "api_error",
      );
      const rejectedError = new ImageRejectedError("Rejected", "Inappropriate");

      // Type guards work correctly
      expect(uploadError instanceof ImageUploadError).toBe(true);
      expect(uploadError instanceof GeminiAnalysisError).toBe(false);
      expect(uploadError instanceof ImageRejectedError).toBe(false);

      expect(geminiError instanceof ImageUploadError).toBe(false);
      expect(geminiError instanceof GeminiAnalysisError).toBe(true);
      expect(geminiError instanceof ImageRejectedError).toBe(false);

      expect(rejectedError instanceof ImageUploadError).toBe(false);
      expect(rejectedError instanceof GeminiAnalysisError).toBe(false);
      expect(rejectedError instanceof ImageRejectedError).toBe(true);
    });

    it("should all be instances of Error", () => {
      const uploadError = new ImageUploadError(
        "Upload failed",
        "storage_upload",
      );
      const geminiError = new GeminiAnalysisError(
        "Analysis failed",
        "api_error",
      );
      const rejectedError = new ImageRejectedError("Rejected", "Inappropriate");

      expect(uploadError instanceof Error).toBe(true);
      expect(geminiError instanceof Error).toBe(true);
      expect(rejectedError instanceof Error).toBe(true);
    });
  });
});
