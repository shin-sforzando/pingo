import { adminAuth } from "@/lib/firebase/admin";
import { dateToISOString } from "@/types/firestore";
import { imageSubmissionDataSchema } from "@/types/schema";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { type NextRequest, NextResponse } from "next/server";
import { ulid } from "ulid";
import { z } from "zod";

// Request schema - reuse from schema.ts with additional fields
const getUploadUrlSchema = imageSubmissionDataSchema.pick({
  gameId: true,
  fileName: true,
  contentType: true,
});

/**
 * Generate signed URL for image upload to Google Cloud Storage
 * POST /api/image/getUploadUrl
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 },
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 },
      );
    }
    const userId = decodedToken.uid;

    // Parse request body
    const body = await request.json();
    const validatedData = getUploadUrlSchema.parse(body);
    const { gameId, contentType } = validatedData;

    // Validate content type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/heic",
      "image/heif",
      "image/webp",
    ];

    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: "Unsupported content type" },
        { status: 400 },
      );
    }

    // Generate submission ID
    const submissionId = ulid();

    // Create file path following the storage structure: /{gameId}/{userId}_{submissionId}.jpg
    const fileExtension = "jpg"; // Always convert to JPEG
    const filePath = `${gameId}/${userId}_${submissionId}.${fileExtension}`;

    // Get storage bucket
    const storage = getStorage();
    const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
    if (!bucketName) {
      return NextResponse.json(
        { error: "Storage bucket not configured" },
        { status: 500 },
      );
    }
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    // Generate signed URL for upload (valid for 5 minutes)
    const [signedUrl] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
      contentType: "image/jpeg", // Force JPEG content type
    });

    return NextResponse.json({
      signedUrl,
      filePath,
      submissionId,
      expiresAt: dateToISOString(new Date(Date.now() + 5 * 60 * 1000)),
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
