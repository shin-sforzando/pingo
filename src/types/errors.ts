/**
 * Custom error classes for type-safe error handling and analytics tracking
 *
 * These error types allow for:
 * - Compile-time type checking using instanceof
 * - Proper categorization of failures for analytics
 * - Better debugging with structured error information
 */

/**
 * Error during image upload infrastructure operations
 *
 * Thrown during:
 * - Signed URL generation
 * - Cloud Storage upload
 * - Submission record creation
 */
export class ImageUploadError extends Error {
  constructor(
    message: string,
    public readonly phase:
      | "url_generation"
      | "storage_upload"
      | "submission_creation",
  ) {
    super(message);
    this.name = "ImageUploadError";

    // Maintain proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ImageUploadError);
    }
  }
}

/**
 * Error during Gemini AI analysis operations
 *
 * Thrown during:
 * - Content safety check (appropriateness)
 * - Subject identification and matching
 * - API communication issues
 */
export class GeminiAnalysisError extends Error {
  constructor(
    message: string,
    public readonly errorType: "api_error" | "timeout" | "rate_limit",
  ) {
    super(message);
    this.name = "GeminiAnalysisError";

    // Maintain proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GeminiAnalysisError);
    }
  }
}

/**
 * Error when uploaded image fails content safety check
 *
 * This is a separate category from GeminiAnalysisError because:
 * - It represents user error (inappropriate content), not system error
 * - It requires different handling in the UI
 * - It should be tracked separately in analytics
 */
export class ImageRejectedError extends Error {
  constructor(
    message: string,
    public readonly reason: string,
  ) {
    super(message);
    this.name = "ImageRejectedError";

    // Maintain proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ImageRejectedError);
    }
  }
}
