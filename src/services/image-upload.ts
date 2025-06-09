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
  console.log("Uploading to signed URL:", signedUrl);
  console.log("Content-Type:", "image/jpeg");
  console.log("Blob size:", processedImage.blob.size);
  console.log("Blob type:", processedImage.blob.type);

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

  // Step 3: Check image content with Gemini API and create submission
  const checkResponse = await fetch("/api/image/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      gameId: submissionData.gameId,
      imageUrl: publicUrl,
      submissionId,
    }),
  });

  if (!checkResponse.ok) {
    const errorData = await checkResponse.json();
    throw new Error(errorData.error || "Failed to check image content");
  }

  const checkResult = await checkResponse.json();

  return {
    submissionId,
    imageUrl: publicUrl,
    appropriate: checkResult.appropriate,
    reason: checkResult.reason,
    confidence: checkResult.confidence,
    matchedCellId: checkResult.matchedCellId,
    acceptanceStatus: checkResult.acceptanceStatus,
    critique: checkResult.critique,
  };
}
