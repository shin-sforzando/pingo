import { adminAuth } from "@/lib/firebase/admin";
import {
  AdminGameParticipationService,
  AdminGameService,
  AdminSubmissionService,
} from "@/lib/firebase/admin-collections";
import type { ApiResponse } from "@/types/common";
import { ProcessingStatus } from "@/types/common";
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

    // Check if game exists and get game data
    const game = await AdminGameService.getGame(gameId);
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

    const isParticipant = await AdminGameParticipationService.isParticipant(
      gameId,
      userId,
    );

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

    // Check submission limit
    const currentSubmissionCount =
      await AdminGameParticipationService.getSubmissionCount(gameId, userId);

    if (game.maxSubmissionsPerUser <= currentSubmissionCount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SUBMISSION_LIMIT_EXCEEDED",
            message: `Maximum ${game.maxSubmissionsPerUser} submissions allowed`,
          },
        },
        { status: 429 },
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

    // Save submission to Firestore using Admin service
    await AdminSubmissionService.createSubmission(gameId, submission);

    console.log(
      `ℹ️ XXX: ~ route.ts ~ Created submission: ${submissionId} for game: ${gameId} by user: ${userId}`,
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

    // Check if game exists and user is participant
    const gameExists = await AdminGameService.gameExists(gameId);
    if (!gameExists) {
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

    const isParticipant = await AdminGameParticipationService.isParticipant(
      gameId,
      userId,
    );

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

    // Get submissions using Admin service
    const submissions = await AdminSubmissionService.getSubmissions(gameId, {
      userId: userIdFilter || undefined,
      limit,
      offset,
    });

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
