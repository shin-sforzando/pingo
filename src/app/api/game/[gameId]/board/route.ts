import { NextResponse } from "next/server";
import { AdminGameBoardService } from "@/lib/firebase/admin-collections";
import type { ApiResponse } from "@/types/common";
import type { GameBoard } from "@/types/schema";

/**
 * GET handler for retrieving game board data
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> },
): Promise<NextResponse<ApiResponse<GameBoard>>> {
  try {
    const { gameId } = await params;

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

    // Get game board using data access layer
    const gameBoard = await AdminGameBoardService.getGameBoard(gameId);

    if (!gameBoard) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BOARD_NOT_FOUND",
            message: "Board not found",
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: gameBoard,
    });
  } catch (error) {
    console.error("Error fetching game board:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to fetch game board",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 },
    );
  }
}
