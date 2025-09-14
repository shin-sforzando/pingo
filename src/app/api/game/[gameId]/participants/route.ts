import { NextResponse } from "next/server";
import { AdminGameParticipationService } from "@/lib/firebase/admin-collections";
import type { ApiResponse } from "@/types/common";

/**
 * GET handler for retrieving game participants
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> },
): Promise<
  NextResponse<
    ApiResponse<
      Array<{
        id: string;
        username: string;
        completedLines: number;
        submissionCount: number;
      }>
    >
  >
> {
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

    // Get participants using data access layer
    const participants =
      await AdminGameParticipationService.getParticipants(gameId);

    return NextResponse.json({
      success: true,
      data: participants,
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to fetch participants",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 },
    );
  }
}
