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
    throw new Error(errorData.error || "Failed to get upload URL");
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
    throw new Error(
      `Failed to upload image to storage: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`,
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
    throw new Error(
      errorData.error?.message || "Failed to check image appropriateness",
    );
  }

  const checkResult = await checkResponse.json();

  // If inappropriate, return early without analysis
  if (!checkResult.data.appropriate) {
    console.log(
      "ℹ️ XXX: ~ image-upload.ts ~ Image inappropriate, skipping analysis",
      {
        reason: checkResult.data.reason,
      },
    );
    return {
      submissionId,
      imageUrl: publicUrl,
      appropriate: false,
      reason: checkResult.data.reason,
      confidence: undefined,
      matchedCellId: undefined,
      acceptanceStatus: undefined,
      critique_ja: "",
      critique_en: "",
      newlyCompletedLines: 0,
      totalCompletedLines: 0,
      requiredBingoLines: 0,
    };
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
    throw new Error(
      errorData.error?.message || "Failed to analyze image content",
    );
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
    throw new Error(errorData.error?.message || "Failed to create submission");
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
