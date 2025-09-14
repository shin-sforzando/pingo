import type { DecodedIdToken } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { type NextRequest, NextResponse } from "next/server";
import { ulid } from "ulid";
import { adminAuth } from "@/lib/firebase/admin";

/**
 * Upload image directly to Google Cloud Storage via server
 * POST /api/image/upload
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
    } catch (error) {
      console.error("Authentication error:", error);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 },
      );
    }
    const userId = decodedToken.uid;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const gameId = formData.get("gameId") as string;

    if (!file || !gameId) {
      return NextResponse.json(
        { error: "File and gameId are required" },
        { status: 400 },
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/heic",
      "image/heif",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 },
      );
    }

    // Validate file size (20MB max)
    const maxSize = 20 * 1024 * 1024;
    if (maxSize < file.size) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // Generate submission ID
    const submissionId = ulid();

    // Create file path
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
    const storageFile = bucket.file(filePath);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Google Cloud Storage
    await storageFile.save(buffer, {
      metadata: {
        contentType: "image/jpeg",
        metadata: {
          originalName: file.name,
          uploadedBy: userId,
          gameId: gameId,
          submissionId: submissionId,
        },
      },
    });

    // Construct public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

    return NextResponse.json({
      submissionId,
      imageUrl: publicUrl,
      filePath,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
