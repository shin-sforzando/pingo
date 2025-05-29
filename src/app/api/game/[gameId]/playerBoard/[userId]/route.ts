import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
import type { ApiResponse } from "@/types/common";
import { LineType } from "@/types/common";
import {
  type PlayerBoardDocument,
  playerBoardFromFirestore,
  playerBoardToFirestore,
} from "@/types/game";
import type { PlayerBoard } from "@/types/schema";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

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
      const gameParticipationRef = adminFirestore
        .collection("game_participations")
        .where("userId", "==", currentUserId)
        .where("gameId", "==", gameId)
        .where("role", "in", ["creator", "admin"]);

      const participationSnapshot = await gameParticipationRef.get();

      if (participationSnapshot.empty) {
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

    // Verify game exists and user is participant
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
        { status: 404 },
      );
    }

    // Get player board
    const playerBoardRef = adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("playerBoards")
      .doc(userId);

    const playerBoardDoc = await playerBoardRef.get();

    if (!playerBoardDoc.exists) {
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

    // Convert Firestore document to PlayerBoard type
    const playerBoardData = playerBoardDoc.data() as PlayerBoardDocument;
    const playerBoard = playerBoardFromFirestore(playerBoardData);

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
          code: "server_error",
          message: "Failed to get player board",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 },
    );
  }
}

// Schema for updating player board
const updatePlayerBoardSchema = z.object({
  cellStates: z
    .record(
      z.string(),
      z.object({
        isOpen: z.boolean(),
        openedAt: z
          .union([z.date(), z.string().datetime()])
          .nullable()
          .transform((val) => {
            if (val === null) return null;
            return val instanceof Date ? val : new Date(val);
          }),
        openedBySubmissionId: z.string().nullable(),
      }),
    )
    .optional(),
  completedLines: z
    .array(
      z.object({
        type: z.nativeEnum(LineType),
        index: z.number(),
        completedAt: z
          .union([z.date(), z.string().datetime()])
          .transform((val) => {
            return val instanceof Date ? val : new Date(val);
          }),
      }),
    )
    .optional(),
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

    // Verify game exists and user is participant
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
        { status: 404 },
      );
    }

    // Get current player board
    const playerBoardRef = adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("playerBoards")
      .doc(userId);

    const playerBoardDoc = await playerBoardRef.get();

    if (!playerBoardDoc.exists) {
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

    // Get current player board data
    const currentPlayerBoardData = playerBoardDoc.data() as PlayerBoardDocument;
    const currentPlayerBoard = playerBoardFromFirestore(currentPlayerBoardData);

    // Create updated player board
    const updatedPlayerBoard: PlayerBoard = {
      ...currentPlayerBoard,
      ...(updateData.cellStates && { cellStates: updateData.cellStates }),
      ...(updateData.completedLines && {
        completedLines: updateData.completedLines,
      }),
    };

    // Convert to Firestore format and update
    const updatedPlayerBoardDoc = playerBoardToFirestore(updatedPlayerBoard);
    await playerBoardRef.set(updatedPlayerBoardDoc, { merge: true });

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
          code: "server_error",
          message: "Failed to update player board",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 },
    );
  }
}
