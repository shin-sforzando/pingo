import {
  GeminiAnalysisError,
  ImageRejectedError,
  ImageUploadError,
} from "@/types/errors";
import type {
  ImageSubmissionData,
  ImageSubmissionResult,
  ProcessedImage,
} from "@/types/schema";

/**
 * Upload image and create submission record
 */
export async function submitImage(
  processedImage: ProcessedImage,
  submissionData: ImageSubmissionData,
  authToken: string,
): Promise<ImageSubmissionResult> {
  // Step 1: Get signed upload URL
  const uploadUrlResponse = await fetch("/api/image/getUploadUrl", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(submissionData),
  });

  if (!uploadUrlResponse.ok) {
    const errorData = await uploadUrlResponse.json();
    throw new ImageUploadError(
      errorData.error || "Failed to get upload URL",
      "url_generation",
    );
  }

  const { signedUrl, filePath, submissionId } = await uploadUrlResponse.json();

  // Step 2: Upload image to Google Cloud Storage
  console.log("ℹ️ XXX: ~ image-upload.ts ~ Uploading to signed URL:", signedUrl);
  console.log("ℹ️ XXX: ~ image-upload.ts ~ Content-Type:", "image/jpeg");
  console.log(
    "ℹ️ XXX: ~ image-upload.ts ~ Blob size:",
    processedImage.blob.size,
  );
  console.log(
    "ℹ️ XXX: ~ image-upload.ts ~ Blob type:",
    processedImage.blob.type,
  );

  const uploadResponse = await fetch(signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "image/jpeg", // Always JPEG as per API
    },
    body: processedImage.blob,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error("Upload failed:", {
      status: uploadResponse.status,
      statusText: uploadResponse.statusText,
      headers: Object.fromEntries(uploadResponse.headers.entries()),
      body: errorText,
    });
    throw new ImageUploadError(
      `Failed to upload image to storage: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`,
      "storage_upload",
    );
  }

  // Construct public URL
  const bucketName =
    process.env.NEXT_PUBLIC_GOOGLE_CLOUD_STORAGE_BUCKET ||
    "pingo-456817-images";
  const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

  // Step 3: Check image appropriateness
  console.log("ℹ️ XXX: ~ image-upload.ts ~ Checking image appropriateness");
  const checkResponse = await fetch("/api/image/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      gameId: submissionData.gameId,
      imageUrl: publicUrl,
    }),
  });

  if (!checkResponse.ok) {
    const errorData = await checkResponse.json();
    // Determine error type based on response status and content
    const errorMessage =
      errorData.error?.message || "Failed to check image appropriateness";

    // Check if it's a Gemini-specific error
    if (
      errorData.error?.code === "GEMINI_API_ERROR" ||
      errorMessage.toLowerCase().includes("gemini") ||
      errorMessage.toLowerCase().includes("api error")
    ) {
      // Classify Gemini error type
      let errorType: "timeout" | "rate_limit" | "api_error" = "api_error";
      if (errorMessage.toLowerCase().includes("timeout")) {
        errorType = "timeout";
      } else if (errorMessage.toLowerCase().includes("rate limit")) {
        errorType = "rate_limit";
      }
      throw new GeminiAnalysisError(errorMessage, errorType);
    }

    // Generic error during check process
    throw new GeminiAnalysisError(errorMessage, "api_error");
  }

  const checkResult = await checkResponse.json();

  // If inappropriate, throw ImageRejectedError instead of returning
  // This allows proper error tracking and consistent error handling
  if (!checkResult.data.appropriate) {
    const reason = checkResult.data.reason || "Content policy violation";
    console.log(
      "ℹ️ XXX: ~ image-upload.ts ~ Image inappropriate, throwing rejection error",
      {
        reason,
      },
    );
    throw new ImageRejectedError(`Image rejected due to: ${reason}`, reason);
  }

  // Step 4: Analyze image for bingo matching
  console.log("ℹ️ XXX: ~ image-upload.ts ~ Analyzing image for bingo matching");
  const analyzeResponse = await fetch(
    `/api/game/${submissionData.gameId}/submission/analyze`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        submissionId,
        imageUrl: publicUrl,
      }),
    },
  );

  if (!analyzeResponse.ok) {
    const errorData = await analyzeResponse.json();
    const errorMessage =
      errorData.error?.message || "Failed to analyze image content";

    // Classify Gemini error type based on error message
    let errorType: "timeout" | "rate_limit" | "api_error" = "api_error";
    if (errorMessage.toLowerCase().includes("timeout")) {
      errorType = "timeout";
    } else if (errorMessage.toLowerCase().includes("rate limit")) {
      errorType = "rate_limit";
    }

    throw new GeminiAnalysisError(errorMessage, errorType);
  }

  const analyzeResult = await analyzeResponse.json();
  console.log("ℹ️ XXX: ~ image-upload.ts ~ Analysis result", {
    analysisResult: analyzeResult.data,
  });

  // Step 5: Create submission and update game state
  console.log(
    "ℹ️ XXX: ~ image-upload.ts ~ Creating submission and updating game state",
  );
  const submissionResponse = await fetch(
    `/api/game/${submissionData.gameId}/submission`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        submissionId,
        imageUrl: publicUrl,
        analysisResult: analyzeResult.data,
      }),
    },
  );

  if (!submissionResponse.ok) {
    const errorData = await submissionResponse.json();
    throw new ImageUploadError(
      errorData.error?.message || "Failed to create submission",
      "submission_creation",
    );
  }

  const submissionResult = await submissionResponse.json();
  console.log("ℹ️ XXX: ~ image-upload.ts ~ Submission created successfully", {
    submissionResult: submissionResult.data,
  });

  return {
    submissionId,
    imageUrl: publicUrl,
    appropriate: true,
    reason: checkResult.data.reason,
    confidence: analyzeResult.data.confidence,
    matchedCellId: analyzeResult.data.matchedCellId,
    acceptanceStatus: analyzeResult.data.acceptanceStatus,
    critique_ja: analyzeResult.data.critique_ja,
    critique_en: analyzeResult.data.critique_en,
    newlyCompletedLines: submissionResult.data.newlyCompletedLines,
    totalCompletedLines: submissionResult.data.totalCompletedLines,
    requiredBingoLines: submissionResult.data.requiredBingoLines,
  };
}
