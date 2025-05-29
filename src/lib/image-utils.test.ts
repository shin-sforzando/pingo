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

// Mock heic2any
vi.mock("heic2any", () => ({
  default: vi.fn(),
}));

// Mock URL API for jsdom environment
Object.defineProperty(global, "URL", {
  value: {
    createObjectURL: vi.fn(),
    revokeObjectURL: vi.fn(),
  },
  writable: true,
});

describe("image-utils", () => {
  describe("constants", () => {
    it("should have correct default options", () => {
      expect(DEFAULT_IMAGE_OPTIONS).toEqual({
        maxLongSide: 1280,
        quality: 0.8,
        format: "image/jpeg",
      });
    });

    it("should have correct max file size", () => {
      expect(MAX_FILE_SIZE).toBe(20 * 1024 * 1024); // 20MB
    });

    it("should support correct image types", () => {
      expect(SUPPORTED_IMAGE_TYPES).toEqual([
        "image/jpeg",
        "image/png",
        "image/heic",
        "image/heif",
        "image/webp",
      ]);
    });
  });

  describe("isValidImageFile", () => {
    it("should return true for supported image types", () => {
      for (const type of SUPPORTED_IMAGE_TYPES) {
        const file = new File(["test"], "test.jpg", { type });
        expect(isValidImageFile(file)).toBe(true);
      }
    });

    it("should return false for unsupported file types", () => {
      const file = new File(["test"], "test.txt", { type: "text/plain" });
      expect(isValidImageFile(file)).toBe(false);
    });
  });

  describe("isValidFileSize", () => {
    it("should return true for files within size limit", () => {
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      Object.defineProperty(file, "size", { value: 5 * 1024 * 1024 }); // 5MB
      expect(isValidFileSize(file)).toBe(true);
    });

    it("should return false for files exceeding size limit", () => {
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      Object.defineProperty(file, "size", { value: 30 * 1024 * 1024 }); // 15MB
      expect(isValidFileSize(file)).toBe(false);
    });

    it("should return true for files at exact size limit", () => {
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      Object.defineProperty(file, "size", { value: MAX_FILE_SIZE });
      expect(isValidFileSize(file)).toBe(true);
    });
  });

  describe("createImagePreviewUrl and revokeImagePreviewUrl", () => {
    it("should create and revoke preview URLs", () => {
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

      // Mock URL.createObjectURL and URL.revokeObjectURL
      const mockUrl = "blob:http://localhost/test";
      const createObjectURLSpy = vi
        .spyOn(URL, "createObjectURL")
        .mockReturnValue(mockUrl);
      const revokeObjectURLSpy = vi
        .spyOn(URL, "revokeObjectURL")
        .mockImplementation(() => {});

      const url = createImagePreviewUrl(file);
      expect(url).toBe(mockUrl);
      expect(createObjectURLSpy).toHaveBeenCalledWith(file);

      revokeImagePreviewUrl(url);
      expect(revokeObjectURLSpy).toHaveBeenCalledWith(mockUrl);

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });
  });

  describe("processImage", () => {
    // Mock canvas and image elements for testing
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({
        drawImage: vi.fn(),
      })),
      toBlob: vi.fn(),
    };

    const mockImage = {
      width: 1920,
      height: 1080,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: "",
    };

    beforeEach(() => {
      // Mock document.createElement
      vi.spyOn(document, "createElement").mockImplementation((tagName) => {
        if (tagName === "canvas") {
          return mockCanvas as unknown as HTMLCanvasElement;
        }
        if (tagName === "img") {
          return mockImage as unknown as HTMLImageElement;
        }
        throw new Error(`Unexpected createElement call with ${tagName}`);
      });

      // Mock URL methods
      vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
      vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should reject unsupported file types", async () => {
      const file = new File(["test"], "test.txt", { type: "text/plain" });

      await expect(processImage(file)).rejects.toThrow(
        "Unsupported file type: text/plain",
      );
    });

    it("should reject files that are too large", async () => {
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      Object.defineProperty(file, "size", { value: 30 * 1024 * 1024 }); // 15MB

      await expect(processImage(file)).rejects.toThrow("File size too large");
    });

    it("should process HEIC files by converting them first", async () => {
      const heic2any = await import("heic2any");
      const mockHeic2any = heic2any.default as ReturnType<typeof vi.fn>;

      // Mock HEIC conversion
      const convertedBlob = new Blob(["converted"], { type: "image/jpeg" });
      mockHeic2any.mockResolvedValue(convertedBlob);

      const file = new File(["heic data"], "test.heic", { type: "image/heic" });
      Object.defineProperty(file, "size", { value: 5 * 1024 * 1024 });

      // Mock successful image loading and canvas conversion
      mockCanvas.toBlob.mockImplementation((callback) => {
        const resultBlob = new Blob(["processed"], { type: "image/jpeg" });
        Object.defineProperty(resultBlob, "size", { value: 2 * 1024 * 1024 });
        callback?.(resultBlob);
      });

      // Simulate image load
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      const result = await processImage(file);

      expect(mockHeic2any).toHaveBeenCalledWith({
        blob: file,
        toType: "image/jpeg",
        quality: 0.9,
      });

      expect(result).toEqual({
        blob: expect.any(Blob),
        originalName: "test.heic",
        originalSize: 5 * 1024 * 1024,
        processedSize: 2 * 1024 * 1024,
        originalDimensions: { width: 1920, height: 1080 },
        processedDimensions: { width: 1280, height: 720 }, // Scaled down
      });
    });

    it("should handle HEIC conversion errors", async () => {
      const heic2any = await import("heic2any");
      const mockHeic2any = heic2any.default as ReturnType<typeof vi.fn>;

      mockHeic2any.mockRejectedValue(new Error("HEIC conversion failed"));

      const file = new File(["heic data"], "test.heic", { type: "image/heic" });
      Object.defineProperty(file, "size", { value: 5 * 1024 * 1024 });

      await expect(processImage(file)).rejects.toThrow(
        "Failed to convert HEIC file: HEIC conversion failed",
      );
    });

    it("should process regular image files without HEIC conversion", async () => {
      const file = new File(["jpeg data"], "test.jpg", { type: "image/jpeg" });
      Object.defineProperty(file, "size", { value: 5 * 1024 * 1024 });

      // Mock successful canvas conversion
      mockCanvas.toBlob.mockImplementation((callback) => {
        const resultBlob = new Blob(["processed"], { type: "image/jpeg" });
        Object.defineProperty(resultBlob, "size", { value: 2 * 1024 * 1024 });
        callback?.(resultBlob);
      });

      // Simulate image load
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      const result = await processImage(file);

      expect(result).toEqual({
        blob: expect.any(Blob),
        originalName: "test.jpg",
        originalSize: 5 * 1024 * 1024,
        processedSize: 2 * 1024 * 1024,
        originalDimensions: { width: 1920, height: 1080 },
        processedDimensions: { width: 1280, height: 720 },
      });
    });
  });
});
