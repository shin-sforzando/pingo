import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/lib/firebase/admin";
import {
  AdminGameParticipationService,
  AdminGameService,
  AdminPlayerBoardService,
} from "@/lib/firebase/admin-collections";
import type { ApiResponse } from "@/types/common";
import {
  cellStateApiSchema,
  completedLineApiSchema,
  type PlayerBoard,
} from "@/types/schema";

/**
 * Get player board for a specific user in a game
 * Only allows access to own player board or if user is game admin
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string; userId: string }> },
): Promise<NextResponse<ApiResponse<PlayerBoard>>> {
  try {
    const { gameId, userId } = await params;

    // Validate parameters
    if (!gameId || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PARAMS",
            message: "Game ID and User ID are required",
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

    // Check if user is requesting their own board or is game admin
    if (currentUserId !== userId) {
      // Check if current user is admin of this game
      const isAdmin = await AdminGameParticipationService.isGameAdmin(
        gameId,
        currentUserId,
      );

      if (!isAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message:
                "Access denied: can only view own player board or must be game admin",
            },
          },
          { status: 403 },
        );
      }
    }

    // Verify game exists
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

    // Check if user is participant in this game
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
        { status: 404 },
      );
    }

    // Get player board
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
            message: "Player board not found",
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: playerBoard,
    });
  } catch (error) {
    console.error("Get player board error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to get player board",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 },
    );
  }
}

// Schema for updating player board - reuse API schemas from schema.ts
const updatePlayerBoardSchema = z.object({
  cellStates: z.record(z.string(), cellStateApiSchema).optional(),
  completedLines: z.array(completedLineApiSchema).optional(),
});

/**
 * Update player board for a specific user in a game
 * Only allows updating own player board
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string; userId: string }> },
): Promise<NextResponse<ApiResponse<PlayerBoard>>> {
  try {
    const { gameId, userId } = await params;

    // Validate parameters
    if (!gameId || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PARAMS",
            message: "Game ID and User ID are required",
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

    // Only allow users to update their own player board
    if (currentUserId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Access denied: can only update own player board",
          },
        },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await request.json();
    const validationResult = updatePlayerBoardSchema.safeParse(body);

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

    // Check if user is participant in this game
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
        { status: 404 },
      );
    }

    // Get current player board
    const currentPlayerBoard = await AdminPlayerBoardService.getPlayerBoard(
      gameId,
      userId,
    );

    if (!currentPlayerBoard) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PLAYER_BOARD_NOT_FOUND",
            message: "Player board not found",
          },
        },
        { status: 404 },
      );
    }

    // Create updated player board by merging existing and new data
    const updatedPlayerBoard: PlayerBoard = {
      ...currentPlayerBoard,
      // Merge cellStates: combine existing and new cell states
      cellStates: {
        ...currentPlayerBoard.cellStates,
        ...(updateData.cellStates || {}),
      },
      // Merge completedLines: combine existing and new completed lines
      completedLines: updateData.completedLines
        ? [...currentPlayerBoard.completedLines, ...updateData.completedLines]
        : currentPlayerBoard.completedLines,
    };

    // Update player board using data access layer
    await AdminPlayerBoardService.updatePlayerBoard(
      gameId,
      userId,
      updatedPlayerBoard,
    );

    return NextResponse.json({
      success: true,
      data: updatedPlayerBoard,
    });
  } catch (error) {
    console.error("Update player board error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to update player board",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 },
    );
  }
}
