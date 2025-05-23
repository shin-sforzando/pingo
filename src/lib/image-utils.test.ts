import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_IMAGE_OPTIONS,
  MAX_FILE_SIZE,
  SUPPORTED_IMAGE_TYPES,
  createImagePreviewUrl,
  isValidFileSize,
  isValidImageFile,
  processImage,
  revokeImagePreviewUrl,
} from "./image-utils";

// Mock canvas and image elements for testing
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(),
  toBlob: vi.fn(),
};

const mockContext = {
  drawImage: vi.fn(),
};

const mockImage = {
  width: 1920,
  height: 1080,
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  src: "",
};

// Mock URL methods
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

beforeEach(() => {
  // Reset mocks
  vi.clearAllMocks();

  // Mock document.createElement
  vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
    if (tagName === "canvas") {
      return mockCanvas as unknown as HTMLCanvasElement;
    }
    return {} as HTMLElement;
  });

  // Mock canvas context
  mockCanvas.getContext.mockReturnValue(mockContext);

  // Mock Image constructor
  global.Image = vi.fn().mockImplementation(() => mockImage);

  // Mock URL methods
  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;

  mockCreateObjectURL.mockReturnValue("blob:mock-url");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("image-utils", () => {
  describe("isValidImageFile", () => {
    it("should return true for supported image types", () => {
      for (const type of SUPPORTED_IMAGE_TYPES) {
        const file = new File([""], "test.jpg", { type });
        expect(isValidImageFile(file)).toBe(true);
      }
    });

    it("should return false for unsupported file types", () => {
      const unsupportedTypes = ["text/plain", "application/pdf", "video/mp4"];

      for (const type of unsupportedTypes) {
        const file = new File([""], "test.txt", { type });
        expect(isValidImageFile(file)).toBe(false);
      }
    });
  });

  describe("isValidFileSize", () => {
    it("should return true for files within size limit", () => {
      const file = new File(["x".repeat(1024)], "test.jpg", {
        type: "image/jpeg",
      });
      expect(isValidFileSize(file)).toBe(true);
    });

    it("should return false for files exceeding size limit", () => {
      const file = new File(["x".repeat(MAX_FILE_SIZE + 1)], "test.jpg", {
        type: "image/jpeg",
      });
      expect(isValidFileSize(file)).toBe(false);
    });

    it("should return true for files at exact size limit", () => {
      const file = new File(["x".repeat(MAX_FILE_SIZE)], "test.jpg", {
        type: "image/jpeg",
      });
      expect(isValidFileSize(file)).toBe(true);
    });
  });

  describe("processImage", () => {
    beforeEach(() => {
      // Mock successful canvas.toBlob
      mockCanvas.toBlob.mockImplementation((callback) => {
        const blob = new Blob(["mock-image-data"], { type: "image/jpeg" });
        callback(blob);
      });
    });

    it("should reject unsupported file types", async () => {
      const file = new File([""], "test.txt", { type: "text/plain" });

      await expect(processImage(file)).rejects.toThrow(
        "Unsupported file type: text/plain",
      );
    });

    it("should reject files that are too large", async () => {
      const file = new File(["x".repeat(MAX_FILE_SIZE + 1)], "test.jpg", {
        type: "image/jpeg",
      });

      await expect(processImage(file)).rejects.toThrow("File size too large");
    });

    it("should process valid image file successfully", async () => {
      const file = new File(["mock-image-data"], "test.jpg", {
        type: "image/jpeg",
      });

      // Simulate successful image loading
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      const result = await processImage(file);

      expect(result).toMatchObject({
        originalName: "test.jpg",
        originalSize: expect.any(Number),
        processedSize: expect.any(Number),
        originalDimensions: {
          width: 1920,
          height: 1080,
        },
        processedDimensions: {
          width: 1280,
          height: 720,
        },
      });

      expect(result.blob).toBeInstanceOf(Blob);
    });

    it("should maintain aspect ratio when resizing", async () => {
      const file = new File(["mock-image-data"], "test.jpg", {
        type: "image/jpeg",
      });

      // Set up image with different aspect ratio
      mockImage.width = 2000;
      mockImage.height = 1000;

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      const result = await processImage(file);

      // Should resize to 1280x640 (maintaining 2:1 aspect ratio)
      expect(result.processedDimensions).toEqual({
        width: 1280,
        height: 640,
      });
    });

    it("should not resize images smaller than max dimension", async () => {
      const file = new File(["mock-image-data"], "test.jpg", {
        type: "image/jpeg",
      });

      // Set up small image
      mockImage.width = 800;
      mockImage.height = 600;

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      const result = await processImage(file);

      // Should keep original dimensions
      expect(result.processedDimensions).toEqual({
        width: 800,
        height: 600,
      });
    });

    it("should use custom processing options", async () => {
      const file = new File(["mock-image-data"], "test.jpg", {
        type: "image/jpeg",
      });

      const customOptions = {
        maxLongSide: 800,
        quality: 0.9,
        format: "image/jpeg" as const,
      };

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      await processImage(file, customOptions);

      // Verify canvas.toBlob was called with custom quality
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        "image/jpeg",
        0.9,
      );
    });

    it("should handle image loading errors", async () => {
      const file = new File(["mock-image-data"], "test.jpg", {
        type: "image/jpeg",
      });

      // Simulate image loading error
      setTimeout(() => {
        if (mockImage.onerror) {
          mockImage.onerror();
        }
      }, 0);

      await expect(processImage(file)).rejects.toThrow("Failed to load image");
    });

    it("should handle canvas context creation failure", async () => {
      const file = new File(["mock-image-data"], "test.jpg", {
        type: "image/jpeg",
      });

      // Mock getContext to return null
      mockCanvas.getContext.mockReturnValue(null);

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      await expect(processImage(file)).rejects.toThrow(
        "Failed to get canvas context",
      );
    });

    it("should handle canvas.toBlob failure", async () => {
      const file = new File(["mock-image-data"], "test.jpg", {
        type: "image/jpeg",
      });

      // Mock toBlob to call callback with null
      mockCanvas.toBlob.mockImplementation((callback) => {
        callback(null);
      });

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      await expect(processImage(file)).rejects.toThrow(
        "Failed to convert canvas to blob",
      );
    });
  });

  describe("createImagePreviewUrl", () => {
    it("should create preview URL for image file", () => {
      const file = new File(["mock-image-data"], "test.jpg", {
        type: "image/jpeg",
      });

      const url = createImagePreviewUrl(file);

      expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
      expect(url).toBe("blob:mock-url");
    });
  });

  describe("revokeImagePreviewUrl", () => {
    it("should revoke preview URL", () => {
      const url = "blob:mock-url";

      revokeImagePreviewUrl(url);

      expect(mockRevokeObjectURL).toHaveBeenCalledWith(url);
    });
  });

  describe("DEFAULT_IMAGE_OPTIONS", () => {
    it("should have correct default values", () => {
      expect(DEFAULT_IMAGE_OPTIONS).toEqual({
        maxLongSide: 1280,
        quality: 0.8,
        format: "image/jpeg",
      });
    });
  });
});
