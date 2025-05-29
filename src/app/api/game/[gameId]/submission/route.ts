import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
import type { ApiResponse } from "@/types/common";
import { ProcessingStatus } from "@/types/common";
import { submissionToFirestore } from "@/types/game";
import { type Submission, submissionSchema } from "@/types/schema";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ulid } from "ulid";

// Schema for creating submission - reuse from schema.ts
const createSubmissionSchema = submissionSchema.pick({
  imageUrl: true,
  memo: true,
});

/**
 * Create a new submission for a game
 * Only allows participants to submit
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
): Promise<NextResponse<ApiResponse<Submission>>> {
  try {
    const { gameId } = await params;

    // Validate parameters
    if (!gameId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PARAMS",
            message: "Game ID is required",
          },
        },
        { status: 400 },
      );
    }

    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Missing authentication token",
          },
        },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Parse request body
    const body = await request.json();
    const validationResult = createSubmissionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Invalid input data",
            details: validationResult.error.errors,
          },
        },
        { status: 400 },
      );
    }

    const { imageUrl, memo } = validationResult.data;

    // Verify game exists
    const gameRef = adminFirestore.collection("games").doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "GAME_NOT_FOUND",
            message: "Game not found",
          },
        },
        { status: 404 },
      );
    }

    // Check if user is participant in this game
    const participantRef = adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("participants")
      .doc(userId);

    const participantDoc = await participantRef.get();
    if (!participantDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_PARTICIPANT",
            message: "User is not a participant in this game",
          },
        },
        { status: 403 },
      );
    }

    // Create submission
    const submissionId = ulid();
    const now = new Date();

    const submission: Submission = {
      id: submissionId,
      userId,
      imageUrl,
      submittedAt: now,
      analyzedAt: null,
      critique: null,
      matchedCellId: null,
      confidence: null,
      processingStatus: ProcessingStatus.UPLOADED,
      acceptanceStatus: null,
      errorMessage: null,
      createdAt: now,
      updatedAt: null,
      memo,
    };

    // Save submission to Firestore
    const submissionRef = adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("submissions")
      .doc(submissionId);

    const submissionDoc = submissionToFirestore(submission);
    await submissionRef.set(submissionDoc);

    console.log(
      `Created submission: ${submissionId} for game: ${gameId} by user: ${userId}`,
    );

    return NextResponse.json({
      success: true,
      data: submission,
    });
  } catch (error) {
    console.error("Create submission error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to create submission",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 },
    );
  }
}

/**
 * Get submissions for a game
 * Only allows participants to view submissions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
): Promise<NextResponse<ApiResponse<Submission[]>>> {
  try {
    const { gameId } = await params;

    // Validate parameters
    if (!gameId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PARAMS",
            message: "Game ID is required",
          },
        },
        { status: 400 },
      );
    }

    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Missing authentication token",
          },
        },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Verify game exists
    const gameRef = adminFirestore.collection("games").doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "GAME_NOT_FOUND",
            message: "Game not found",
          },
        },
        { status: 404 },
      );
    }

    // Check if user is participant in this game
    const participantRef = adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("participants")
      .doc(userId);

    const participantDoc = await participantRef.get();
    if (!participantDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_PARTICIPANT",
            message: "User is not a participant in this game",
          },
        },
        { status: 403 },
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const userIdFilter = url.searchParams.get("userId");
    const limit = Math.min(
      Math.max(1, Number.parseInt(url.searchParams.get("limit") || "50", 10)),
      100,
    );
    const offset = Math.max(
      0,
      Number.parseInt(url.searchParams.get("offset") || "0", 10),
    );

    // Build query
    let query = adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("submissions")
      .orderBy("submittedAt", "desc");

    // Filter by user if specified
    if (userIdFilter) {
      query = query.where("userId", "==", userIdFilter);
    }

    // Apply pagination
    if (0 < offset) {
      const offsetSnapshot = await query.limit(offset).get();
      if (offsetSnapshot.empty) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }
      const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
      query = query.startAfter(lastDoc);
    }

    query = query.limit(limit);

    // Execute query
    const submissionsSnapshot = await query.get();

    // Convert to Submission objects
    const submissions: Submission[] = [];
    for (const doc of submissionsSnapshot.docs) {
      const submissionData = doc.data();
      // Convert Firestore document to Submission type
      const submission: Submission = {
        id: submissionData.id,
        userId: submissionData.userId,
        imageUrl: submissionData.imageUrl,
        submittedAt: submissionData.submittedAt.toDate(),
        analyzedAt: submissionData.analyzedAt?.toDate() || null,
        critique: submissionData.critique,
        matchedCellId: submissionData.matchedCellId,
        confidence: submissionData.confidence,
        processingStatus: submissionData.processingStatus,
        acceptanceStatus: submissionData.acceptanceStatus,
        errorMessage: submissionData.errorMessage,
        createdAt: submissionData.createdAt.toDate(),
        updatedAt: submissionData.updatedAt?.toDate() || null,
        memo: submissionData.memo,
      };
      submissions.push(submission);
    }

    return NextResponse.json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    console.error("Get submissions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to get submissions",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 },
    );
  }
}
