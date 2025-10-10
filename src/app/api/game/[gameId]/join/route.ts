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
      const existingParticipation = participationDoc.data();
      return NextResponse.json({
        success: true,
        data: {
          participationId: existingParticipation?.id || userId,
          alreadyParticipating: true,
        },
      });
    }

    // Generate IDs for the transaction
    const participationId = ulid();
    const eventId = ulid();

    // Execute game join transaction
    const result = await AdminTransactionService.joinGame(
      gameId,
      userId,
      user.username,
      participationId,
      eventId,
    );

    if (!result.success) {
      // Check if error is due to already participating
      if (result.error?.includes("already participating")) {
        return NextResponse.json({
          success: true,
          data: {
            participationId: userId,
            alreadyParticipating: true,
          },
        });
      }

      // Handle other transaction errors
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TRANSACTION_FAILED",
            message: result.error || "Failed to join game",
          },
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        participationId,
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
