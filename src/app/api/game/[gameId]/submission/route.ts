import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { detectCompletedLines } from "@/lib/bingo-logic";
import { adminAuth } from "@/lib/firebase/admin";
import {
  AdminGameBoardService,
  AdminGameParticipationService,
  AdminGameService,
  AdminPlayerBoardService,
  AdminSubmissionService,
  AdminTransactionService,
} from "@/lib/firebase/admin-collections";
import type { ApiResponse } from "@/types/common";
import { AcceptanceStatus, ProcessingStatus } from "@/types/common";
import type { Submission } from "@/types/schema";
import { analysisResultSchema } from "@/types/schema";

// Request body schema for state update
const submissionRequestSchema = z.object({
  submissionId: z.string(),
  imageUrl: z.string().url(),
  analysisResult: analysisResultSchema,
});

// Response data schema
interface SubmissionResponse {
  newlyCompletedLines: number;
  totalCompletedLines: number;
  requiredBingoLines: number;
}

/**
 * POST /api/game/[gameId]/submission
 * Create submission record and update game state
 *
 * Single Responsibility: State management (submission creation, board updates, line detection)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
): Promise<NextResponse<ApiResponse<SubmissionResponse>>> {
  try {
    const { gameId } = await params;
    console.log("ℹ️ XXX: ~ submission/route.ts ~ POST called", { gameId });

    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_TOKEN",
            message: "Missing authentication token",
          },
        },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    console.log("ℹ️ XXX: ~ submission/route.ts ~ User authenticated", {
      userId,
    });

    // Parse request body
    const body = await request.json();
    const { submissionId, imageUrl, analysisResult } =
      submissionRequestSchema.parse(body);
    console.log("ℹ️ XXX: ~ submission/route.ts ~ Request parsed", {
      submissionId,
      imageUrl,
      analysisResult,
    });

    // Verify user is game participant
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

    // Get game and game board
    const [game, gameBoard] = await Promise.all([
      AdminGameService.getGame(gameId),
      AdminGameBoardService.getGameBoard(gameId),
    ]);

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

    if (!gameBoard) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "GAME_BOARD_NOT_FOUND",
            message: "Game board not found",
          },
        },
        { status: 404 },
      );
    }

    // Get player board (should exist - created when user joined game)
    const playerBoard = await AdminPlayerBoardService.getPlayerBoard(
      gameId,
      userId,
    );
    if (!playerBoard) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PLAYER_BOARD_NOT_FOUND",
            message: "Player board not found. Please join the game first.",
          },
        },
        { status: 404 },
      );
    }

    const now = new Date();

    // Create submission record
    const submission: Submission = {
      id: submissionId,
      userId,
      imageUrl,
      submittedAt: now,
      analyzedAt: now,
      critique_ja: analysisResult.critique_ja,
      critique_en: analysisResult.critique_en,
      matchedCellId: analysisResult.matchedCellId,
      confidence: analysisResult.confidence,
      processingStatus: ProcessingStatus.ANALYZED,
      acceptanceStatus: analysisResult.acceptanceStatus,
      errorMessage: null,
      createdAt: now,
      updatedAt: null,
    };

    // Check if submission is accepted and should update board
    const isAccepted =
      analysisResult.matchedCellId &&
      analysisResult.acceptanceStatus === AcceptanceStatus.ACCEPTED &&
      game.confidenceThreshold <= analysisResult.confidence;

    if (isAccepted && analysisResult.matchedCellId) {
      // Check if cell is not already open (prevent race conditions)
      if (!playerBoard.cellStates[analysisResult.matchedCellId]?.isOpen) {
        // Update cell state
        playerBoard.cellStates[analysisResult.matchedCellId] = {
          isOpen: true,
          openedAt: now,
          openedBySubmissionId: submissionId,
        };

        console.log(
          "ℹ️ XXX: ~ submission/route.ts ~ Cell opened, detecting lines",
          {
            openedCellId: analysisResult.matchedCellId,
            previousCompletedLines: playerBoard.completedLines.length,
          },
        );

        // Detect completed bingo lines after opening the cell
        const newCompletedLines = detectCompletedLines(playerBoard);
        console.log("ℹ️ XXX: ~ submission/route.ts ~ Line detection completed", {
          totalDetectedLines: newCompletedLines.length,
          detectedLines: newCompletedLines.map((line) => ({
            type: line.type,
            index: line.index,
          })),
        });

        // Only add newly completed lines (not already in playerBoard.completedLines)
        const existingLineKeys = new Set(
          playerBoard.completedLines.map(
            (line) => `${line.type}-${line.index}`,
          ),
        );

        const freshlyCompletedLines = newCompletedLines.filter(
          (line) => !existingLineKeys.has(`${line.type}-${line.index}`),
        );

        console.log("ℹ️ XXX: ~ submission/route.ts ~ Newly completed lines", {
          existingLinesCount: playerBoard.completedLines.length,
          freshlyCompletedCount: freshlyCompletedLines.length,
          freshlyCompletedLines: freshlyCompletedLines.map((line) => ({
            type: line.type,
            index: line.index,
          })),
        });

        // Add newly completed lines to player board
        playerBoard.completedLines = [
          ...playerBoard.completedLines,
          ...freshlyCompletedLines,
        ];

        console.log("ℹ️ XXX: ~ submission/route.ts ~ Updated player board", {
          totalCompletedLines: playerBoard.completedLines.length,
          allCompletedLines: playerBoard.completedLines.map((line) => ({
            type: line.type,
            index: line.index,
          })),
        });

        // Use transaction to ensure atomicity between submission creation and board update
        const transactionResult =
          await AdminTransactionService.createSubmissionAndUpdateBoard(
            gameId,
            submission,
            playerBoard,
            userId,
          );

        if (!transactionResult.success) {
          console.error("Transaction failed:", transactionResult.error);
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "TRANSACTION_FAILED",
                message: "Failed to update game state",
                details: transactionResult.error,
              },
            },
            { status: 500 },
          );
        }

        // Return success response with line completion information
        return NextResponse.json({
          success: true,
          data: {
            newlyCompletedLines: freshlyCompletedLines.length,
            totalCompletedLines: playerBoard.completedLines.length,
            requiredBingoLines: game.requiredBingoLines,
          },
        });
      }

      // Cell is already open, just create submission without board update
      const transactionResult =
        await AdminTransactionService.createSubmissionOnly(gameId, submission);

      if (!transactionResult.success) {
        console.error("Failed to create submission:", transactionResult.error);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "SUBMISSION_CREATION_FAILED",
              message: "Failed to create submission",
              details: transactionResult.error,
            },
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          newlyCompletedLines: 0,
          totalCompletedLines: playerBoard.completedLines.length,
          requiredBingoLines: game.requiredBingoLines,
        },
      });
    }

    // Not accepted or no matched cell, just create submission
    const transactionResult =
      await AdminTransactionService.createSubmissionOnly(gameId, submission);

    if (!transactionResult.success) {
      console.error("Failed to create submission:", transactionResult.error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SUBMISSION_CREATION_FAILED",
            message: "Failed to create submission",
            details: transactionResult.error,
          },
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        newlyCompletedLines: 0,
        totalCompletedLines: playerBoard.completedLines.length,
        requiredBingoLines: game.requiredBingoLines,
      },
    });
  } catch (error) {
    console.error("Failed to process submission:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: error.issues,
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PROCESSING_FAILED",
          message: "Failed to process submission",
          details: error instanceof Error ? error.message : "Unknown error",
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
