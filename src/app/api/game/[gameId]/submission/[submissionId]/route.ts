import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import {
  AdminBatchService,
  AdminGameParticipationService,
  AdminSubmissionService,
} from "@/lib/firebase/admin-collections";
import type { ApiResponse } from "@/types/common";
import { ProcessingStatus } from "@/types/common";
import { type Submission, submissionSchema } from "@/types/schema";

// Schema for updating submission - reuse from schema.ts
const updateSubmissionSchema = submissionSchema
  .pick({
    critique: true,
    matchedCellId: true,
    confidence: true,
    processingStatus: true,
    acceptanceStatus: true,
    errorMessage: true,
    memo: true,
  })
  .partial();

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

    // Get game, participant, and submission data in parallel for better performance
    const { game, isParticipant, submission } =
      await AdminBatchService.getGameSubmissionContext(
        gameId,
        userId,
        submissionId,
      );

    if (!game) {
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

    if (!isParticipant) {
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

    if (!submission) {
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
          code: "SERVER_ERROR",
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
            details: validationResult.error.issues,
          },
        },
        { status: 400 },
      );
    }

    const updateData = validationResult.data;

    // Get game, participant, and submission data in parallel for better performance
    const {
      game,
      isParticipant,
      submission: currentSubmission,
    } = await AdminBatchService.getGameSubmissionContext(
      gameId,
      currentUserId,
      submissionId,
    );

    if (!game) {
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

    if (!isParticipant) {
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

    if (!currentSubmission) {
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

    // Check if user can update this submission
    const isOwner = currentSubmission.userId === currentUserId;
    let isAdmin = false;

    if (!isOwner) {
      // Check if current user is admin of this game
      isAdmin = await AdminGameParticipationService.isGameAdmin(
        gameId,
        currentUserId,
      );
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

    // Update submission
    await AdminSubmissionService.updateSubmission(
      gameId,
      submissionId,
      updatedSubmission,
    );

    console.log(
      `ℹ️ XXX: ~ route.ts ~ Updated submission: ${submissionId} in game: ${gameId} by user: ${currentUserId}`,
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
          code: "SERVER_ERROR",
          message: "Failed to update submission",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 },
    );
  }
}
