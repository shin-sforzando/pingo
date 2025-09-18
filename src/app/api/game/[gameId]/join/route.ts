import { getFirestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { ulid } from "ulid";
import { adminAuth } from "@/lib/firebase/admin";
import {
  AdminGameService,
  AdminUserService,
} from "@/lib/firebase/admin-collections";
import type { ApiResponse } from "@/types/common";
import { dateToAdminTimestamp } from "@/types/firestore";
import type { GameBoard } from "@/types/schema";

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

    // Check if user is already participating
    const db = getFirestore();
    const participationSnapshot = await db
      .collection("games")
      .doc(gameId)
      .collection("participants")
      .where("userId", "==", userId)
      .get();

    if (!participationSnapshot.empty) {
      // User is already participating - return success with existing participation
      const existingParticipation = participationSnapshot.docs[0].data();
      return NextResponse.json({
        success: true,
        data: {
          participationId: existingParticipation.id,
          alreadyParticipating: true,
        },
      });
    }

    // Create participation record
    const participationId = ulid();
    const now = new Date();
    const participation = {
      id: participationId,
      gameId,
      userId,
      username: user.username,
      joinedAt: dateToAdminTimestamp(now),
      completedLines: 0,
      isWinner: false,
      createdAt: dateToAdminTimestamp(now),
    };

    // Save to participants subcollection with userId as document ID
    await db
      .collection("games")
      .doc(gameId)
      .collection("participants")
      .doc(userId) // Use userId as document ID for consistency
      .set(participation);

    // Get game board cells from the correct location
    const gameBoardDoc = await db
      .collection("games")
      .doc(gameId)
      .collection("board")
      .doc("board")
      .get();
    if (!gameBoardDoc.exists) {
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

    const gameBoard = gameBoardDoc.data() as GameBoard;

    // Create player board with initial cell states (all players use the same board)
    // Use object type for Firestore document structure
    const cellStates: Record<
      string,
      {
        isOpen: boolean;
        openedAt: ReturnType<typeof dateToAdminTimestamp>;
        openedBySubmissionId: string | null;
      }
    > = {};

    // Initialize all cell states as not opened
    gameBoard.cells.forEach((cell) => {
      cellStates[cell.id] = {
        isOpen: cell.isFree || false, // Free cells start as open
        openedAt: cell.isFree ? dateToAdminTimestamp(new Date()) : null,
        openedBySubmissionId: null,
      };
    });

    const playerBoard = {
      userId,
      cellStates,
      completedLines: [],
    };

    // Store in the correct subcollection: games/{gameId}/playerBoards/{userId}
    await db
      .collection("games")
      .doc(gameId)
      .collection("playerBoards")
      .doc(userId)
      .set(playerBoard);

    // Update user's participating games
    const updatedParticipatingGames = [
      ...(user.participatingGames || []),
      gameId,
    ];
    await db
      .collection("users")
      .doc(userId)
      .update({
        participatingGames: updatedParticipatingGames,
        updatedAt: dateToAdminTimestamp(new Date()),
      });

    // Create game event
    const eventId = ulid();
    await db
      .collection("game_events")
      .doc(eventId)
      .set({
        id: eventId,
        gameId,
        type: "player_joined",
        userId,
        username: user.username,
        details: {
          participationId,
        },
        createdAt: dateToAdminTimestamp(new Date()),
      });

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
