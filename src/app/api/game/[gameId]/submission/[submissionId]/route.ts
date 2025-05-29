import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
import type { ApiResponse } from "@/types/common";
import { AcceptanceStatus, ProcessingStatus } from "@/types/common";
import {
  type SubmissionDocument,
  submissionFromFirestore,
  submissionToFirestore,
} from "@/types/game";
import type { Submission } from "@/types/schema";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

// Schema for updating submission
const updateSubmissionSchema = z.object({
  critique: z.string().nullable().optional(),
  matchedCellId: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  processingStatus: z.nativeEnum(ProcessingStatus).optional(),
  acceptanceStatus: z.nativeEnum(AcceptanceStatus).nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  memo: z.string().optional(),
});

/**
 * Get a specific submission
 * Only allows participants to view submissions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string; submissionId: string }> },
): Promise<NextResponse<ApiResponse<Submission>>> {
  try {
    const { gameId, submissionId } = await params;

    // Validate parameters
    if (!gameId || !submissionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PARAMS",
            message: "Game ID and Submission ID are required",
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

    // Get submission
    const submissionRef = adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("submissions")
      .doc(submissionId);

    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SUBMISSION_NOT_FOUND",
            message: "Submission not found",
          },
        },
        { status: 404 },
      );
    }

    // Convert Firestore document to Submission type
    const submissionData = submissionDoc.data() as SubmissionDocument;
    const submission = submissionFromFirestore(submissionData);

    return NextResponse.json({
      success: true,
      data: submission,
    });
  } catch (error) {
    console.error("Get submission error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "server_error",
          message: "Failed to get submission",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 },
    );
  }
}

/**
 * Update a specific submission
 * Only allows submission owner or game admin to update
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string; submissionId: string }> },
): Promise<NextResponse<ApiResponse<Submission>>> {
  try {
    const { gameId, submissionId } = await params;

    // Validate parameters
    if (!gameId || !submissionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PARAMS",
            message: "Game ID and Submission ID are required",
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
    const currentUserId = decodedToken.uid;

    // Parse request body
    const body = await request.json();
    const validationResult = updateSubmissionSchema.safeParse(body);

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

    const updateData = validationResult.data;

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
      .doc(currentUserId);

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

    // Get current submission
    const submissionRef = adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("submissions")
      .doc(submissionId);

    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SUBMISSION_NOT_FOUND",
            message: "Submission not found",
          },
        },
        { status: 404 },
      );
    }

    // Get current submission data
    const currentSubmissionData = submissionDoc.data() as SubmissionDocument;
    const currentSubmission = submissionFromFirestore(currentSubmissionData);

    // Check if user can update this submission
    const isOwner = currentSubmission.userId === currentUserId;
    let isAdmin = false;

    if (!isOwner) {
      // Check if current user is admin of this game
      const gameParticipationRef = adminFirestore
        .collection("game_participations")
        .where("userId", "==", currentUserId)
        .where("gameId", "==", gameId)
        .where("role", "in", ["creator", "admin"]);

      const participationSnapshot = await gameParticipationRef.get();
      isAdmin = !participationSnapshot.empty;
    }

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message:
              "Access denied: can only update own submission or must be game admin",
          },
        },
        { status: 403 },
      );
    }

    // Create updated submission
    const now = new Date();
    const updatedSubmission: Submission = {
      ...currentSubmission,
      ...(updateData.critique !== undefined && {
        critique: updateData.critique,
      }),
      ...(updateData.matchedCellId !== undefined && {
        matchedCellId: updateData.matchedCellId,
      }),
      ...(updateData.confidence !== undefined && {
        confidence: updateData.confidence,
      }),
      ...(updateData.processingStatus !== undefined && {
        processingStatus: updateData.processingStatus,
      }),
      ...(updateData.acceptanceStatus !== undefined && {
        acceptanceStatus: updateData.acceptanceStatus,
      }),
      ...(updateData.errorMessage !== undefined && {
        errorMessage: updateData.errorMessage,
      }),
      ...(updateData.memo !== undefined && { memo: updateData.memo }),
      updatedAt: now,
    };

    // If processing status is being updated to ANALYZED, set analyzedAt
    if (
      updateData.processingStatus === ProcessingStatus.ANALYZED &&
      !currentSubmission.analyzedAt
    ) {
      updatedSubmission.analyzedAt = now;
    }

    // Convert to Firestore format and update
    const updatedSubmissionDoc = submissionToFirestore(updatedSubmission);
    await submissionRef.set(updatedSubmissionDoc, { merge: true });

    console.log(
      `Updated submission: ${submissionId} in game: ${gameId} by user: ${currentUserId}`,
    );

    return NextResponse.json({
      success: true,
      data: updatedSubmission,
    });
  } catch (error) {
    console.error("Update submission error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "server_error",
          message: "Failed to update submission",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 },
    );
  }
}
