import { getFirestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { ulid } from "ulid";
import { adminAuth } from "@/lib/firebase/admin";
import {
  AdminGameService,
  AdminTransactionService,
  AdminUserService,
} from "@/lib/firebase/admin-collections";
import type { ApiResponse } from "@/types/common";

/**
 * POST handler for joining a game
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> },
): Promise<NextResponse<ApiResponse<{ participationId: string }>>> {
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

    // Verify the user
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authorization required",
          },
        },
        { status: 401 },
      );
    }

    const idToken = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Get user info
    const user = await AdminUserService.getUser(userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
        },
        { status: 404 },
      );
    }

    // Get game info
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

    // Check if game has expired
    if (game.expiresAt && new Date(game.expiresAt) < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "GAME_EXPIRED",
            message: "Game has expired",
          },
        },
        { status: 400 },
      );
    }

    // Check if user is already participating (quick check before transaction)
    const db = getFirestore();
    const participationDoc = await db
      .collection("games")
      .doc(gameId)
      .collection("participants")
      .doc(userId)
      .get();

    if (participationDoc.exists) {
      // User is already participating - return success with existing participation
      return NextResponse.json({
        success: true,
        data: {
          participationId: userId,
          alreadyParticipating: true,
        },
      });
    }

    // Generate event ID for the transaction
    const eventId = ulid();

    // Execute game join transaction
    const result = await AdminTransactionService.joinGame(
      gameId,
      userId,
      eventId,
    );

    if (!result.success) {
      const errorMessage = result.error || "";

      // Map specific transaction errors to appropriate response codes
      if (errorMessage.includes("already participating")) {
        return NextResponse.json({
          success: true,
          data: {
            participationId: userId,
            alreadyParticipating: true,
          },
        });
      }

      if (errorMessage.includes("Game board not found")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "GAME_BOARD_NOT_FOUND",
              message:
                "Game board data is missing. Please contact the game creator.",
              details: errorMessage,
            },
          },
          { status: 404 },
        );
      }

      if (errorMessage.includes("Player board already exists")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "PLAYER_BOARD_EXISTS",
              message:
                "You already have a player board for this game. Please try refreshing.",
              details: errorMessage,
            },
          },
          { status: 409 }, // Conflict
        );
      }

      // Handle other unexpected transaction errors
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TRANSACTION_FAILED",
            message:
              "Failed to join game due to a database error. Please try again.",
            details: errorMessage,
          },
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        participationId: userId,
      },
    });
  } catch (error) {
    console.error("Error joining game:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to join game",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 },
    );
  }
}
