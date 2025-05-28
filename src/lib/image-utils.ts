/**
 * Image processing utilities for client-side image manipulation
 * Handles JPEG conversion, resizing, and optimization
 * Supports HEIC/HEIF to JPEG conversion using heic2any
 */

// Dynamic import for heic2any to avoid SSR issues
let heic2any: typeof import("heic2any").default | null = null;

export interface ImageProcessingOptions {
  /**
   * Maximum dimension for the longer side of the image
   */
  maxLongSide: number;
  /**
   * JPEG quality (0.0 to 1.0)
   */
  quality: number;
  /**
   * Output format
   */
  format: "image/jpeg";
}

export interface ProcessedImage {
  /**
   * Processed image as Blob
   */
  blob: Blob;
  /**
   * Original file name
   */
  originalName: string;
  /**
   * Original file size in bytes
   */
  originalSize: number;
  /**
   * Processed file size in bytes
   */
  processedSize: number;
  /**
   * Original dimensions
   */
  originalDimensions: {
    width: number;
    height: number;
  };
  /**
   * Processed dimensions
   */
  processedDimensions: {
    width: number;
    height: number;
  };
}

/**
 * Default image processing options
 */
export const DEFAULT_IMAGE_OPTIONS: ImageProcessingOptions = {
  maxLongSide: 1280,
  quality: 0.8,
  format: "image/jpeg",
};

/**
 * Supported input file types
 */
export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
] as const;

/**
 * Supported file extensions
 */
const SUPPORTED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".heic",
  ".heif",
  ".webp",
] as const;

/**
 * Maximum file size in bytes (20MB)
 */
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

/**
 * HEIC/HEIF file types that require conversion
 */
const HEIC_TYPES = ["image/heic", "image/heif"] as const;

/**
 * HEIC/HEIF file extensions
 */
const HEIC_EXTENSIONS = [".heic", ".heif"] as const;

/**
 * Dynamically imports heic2any to avoid SSR issues
 */
async function getHeic2any() {
  if (!heic2any && typeof window !== "undefined") {
    const module = await import("heic2any");
    heic2any = module.default;
  }
  return heic2any;
}

/**
 * Gets file extension from filename
 */
function getFileExtension(filename: string): string {
  return filename.toLowerCase().substring(filename.lastIndexOf("."));
}

/**
 * Checks if the file is a HEIC/HEIF format by MIME type or extension
 */
function isHeicFile(file: File): boolean {
  const isMimeTypeHeic = HEIC_TYPES.includes(
    file.type as (typeof HEIC_TYPES)[number],
  );
  const isExtensionHeic = HEIC_EXTENSIONS.includes(
    getFileExtension(file.name) as (typeof HEIC_EXTENSIONS)[number],
  );
  return isMimeTypeHeic || isExtensionHeic;
}

/**
 * Converts HEIC/HEIF file to JPEG using heic2any
 * Returns the converted file or the original file if conversion is not needed
 */
async function convertHeicToJpeg(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file;
  }

  try {
    const heic2anyLib = await getHeic2any();
    if (!heic2anyLib) {
      throw new Error("heic2any library not available");
    }

    const convertedBlob = await heic2anyLib({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9, // High quality for initial conversion, will be optimized later
    });

    // heic2any can return Blob or Blob[], handle both cases
    const blob = Array.isArray(convertedBlob)
      ? convertedBlob[0]
      : convertedBlob;

    // Create new File object with JPEG type
    const convertedFile = new File(
      [blob],
      file.name.replace(/\.(heic|heif)$/i, ".jpg"),
      { type: "image/jpeg" },
    );

    return convertedFile;
  } catch (error) {
    throw new Error(
      `Failed to convert HEIC file: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Validates if the file is a supported image type by MIME type or extension
 */
export function isValidImageFile(file: File): boolean {
  // Check MIME type
  const isMimeTypeSupported = SUPPORTED_IMAGE_TYPES.includes(
    file.type as (typeof SUPPORTED_IMAGE_TYPES)[number],
  );

  // Check file extension
  const extension = getFileExtension(file.name);
  const isExtensionSupported = SUPPORTED_EXTENSIONS.includes(
    extension as (typeof SUPPORTED_EXTENSIONS)[number],
  );

  return isMimeTypeSupported || isExtensionSupported;
}

/**
 * Validates file size
 */
export function isValidFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * Creates an Image element from a File
 */
function createImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Calculates new dimensions while maintaining aspect ratio
 */
function calculateNewDimensions(
  originalWidth: number,
  originalHeight: number,
  maxLongSide: number,
): { width: number; height: number } {
  const longSide = Math.max(originalWidth, originalHeight);

  // If image is already smaller than max, return original dimensions
  if (longSide <= maxLongSide) {
    return { width: originalWidth, height: originalHeight };
  }

  const ratio = maxLongSide / longSide;
  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio),
  };
}

/**
 * Processes an image file by resizing and converting to JPEG
 */
export async function processImage(
  file: File,
  options: ImageProcessingOptions = DEFAULT_IMAGE_OPTIONS,
): Promise<ProcessedImage> {
  // Validate file type
  if (!isValidImageFile(file)) {
    throw new Error(`Unsupported file type: ${file.type} (${file.name})`);
  }

  // Validate file size
  if (!isValidFileSize(file)) {
    throw new Error(
      `File size too large: ${file.size} bytes (max: ${MAX_FILE_SIZE} bytes)`,
    );
  }

  // Convert HEIC/HEIF to JPEG if needed
  const processedFile = await convertHeicToJpeg(file);

  // Load image
  const img = await createImageFromFile(processedFile);
  const originalDimensions = { width: img.width, height: img.height };

  // Calculate new dimensions
  const processedDimensions = calculateNewDimensions(
    img.width,
    img.height,
    options.maxLongSide,
  );

  // Create canvas and resize image
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  canvas.width = processedDimensions.width;
  canvas.height = processedDimensions.height;

  // Draw resized image
  ctx.drawImage(
    img,
    0,
    0,
    processedDimensions.width,
    processedDimensions.height,
  );

  // Convert to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      },
      options.format,
      options.quality,
    );
  });

  return {
    blob,
    originalName: file.name,
    originalSize: file.size,
    processedSize: blob.size,
    originalDimensions,
    processedDimensions,
  };
}

/**
 * Generates a preview URL for an image file
 */
export function createImagePreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revokes a preview URL to free memory
 */
export function revokeImagePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}
