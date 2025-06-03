import { validateGameId } from "@/lib/api-utils";
import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
import type { ApiResponse } from "@/types/common";
import { dateToISOString } from "@/types/firestore";
import {
  type GameDocument,
  gameFromFirestore,
  gameToFirestore,
} from "@/types/game";
import type { Game } from "@/types/schema";
import { gameSchema } from "@/types/schema";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

// Schema for updating game - pick updatable fields from gameSchema and make them optional
const updateGameSchema = gameSchema
  .pick({
    title: true,
    theme: true,
    status: true,
    isPublic: true,
    isPhotoSharingEnabled: true,
    requiredBingoLines: true,
    confidenceThreshold: true,
    notes: true,
    expiresAt: true,
  })
  .partial()
  .extend({
    // Handle date transformation for expiresAt
    expiresAt: z
      .union([z.date(), z.string().datetime()])
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        return val instanceof Date ? val : new Date(val);
      }),
  });

/**
 * GET handler for retrieving game data
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
  console.log("ℹ️ XXX: ~ route.ts ~ request:", request);
  try {
    const { gameId } = await params;

    const validationError = validateGameId(gameId);
    if (validationError) return validationError;

    const gameDoc = await adminFirestore.collection("games").doc(gameId).get();

    if (!gameDoc.exists) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const gameData = gameDoc.data();
    if (!gameData) {
      return NextResponse.json(
        { error: "Game data is empty" },
        { status: 404 },
      );
    }

    // Convert Firestore data to application model using the converter function
    const convertedGame = gameFromFirestore({
      ...gameData,
      id: gameDoc.id,
    } as GameDocument);

    // Return the converted game data in ApiResponse format
    return NextResponse.json({
      success: true,
      data: convertedGame,
    });
  } catch (error) {
    console.error("Error fetching game data:", error);
    return NextResponse.json(
      { error: "Failed to fetch game data" },
      { status: 500 },
    );
  }
}

/**
 * PUT handler for updating game data
 * Only allows game creator or admin to update
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
): Promise<NextResponse<ApiResponse<Game>>> {
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
    const currentUserId = decodedToken.uid;

    // Parse request body
    const body = await request.json();
    const validationResult = updateGameSchema.safeParse(body);

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

    // Get current game
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

    // Get current game data
    const currentGameData = gameDoc.data() as GameDocument;
    const currentGame = gameFromFirestore(currentGameData);

    // Check if user can update this game
    const isCreator = currentGame.creatorId === currentUserId;
    let isAdmin = false;

    if (!isCreator) {
      // Check if current user is admin of this game
      const gameParticipationRef = adminFirestore
        .collection("game_participations")
        .where("userId", "==", currentUserId)
        .where("gameId", "==", gameId)
        .where("role", "in", ["creator", "admin"]);

      const participationSnapshot = await gameParticipationRef.get();
      isAdmin = !participationSnapshot.empty;
    }

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message:
              "Access denied: only game creator or admin can update game",
          },
        },
        { status: 403 },
      );
    }

    // Create updated game
    const now = new Date();
    const updatedGame: Game = {
      ...currentGame,
      ...(updateData.title !== undefined && { title: updateData.title }),
      ...(updateData.theme !== undefined && { theme: updateData.theme }),
      ...(updateData.status !== undefined && { status: updateData.status }),
      ...(updateData.isPublic !== undefined && {
        isPublic: updateData.isPublic,
      }),
      ...(updateData.isPhotoSharingEnabled !== undefined && {
        isPhotoSharingEnabled: updateData.isPhotoSharingEnabled,
      }),
      ...(updateData.requiredBingoLines !== undefined && {
        requiredBingoLines: updateData.requiredBingoLines,
      }),
      ...(updateData.confidenceThreshold !== undefined && {
        confidenceThreshold: updateData.confidenceThreshold,
      }),
      ...(updateData.notes !== undefined && { notes: updateData.notes }),
      ...(updateData.expiresAt !== undefined && {
        expiresAt: updateData.expiresAt,
      }),
      updatedAt: now,
    };

    // Convert to Firestore format and update
    const updatedGameDoc = gameToFirestore(updatedGame);
    await gameRef.set(updatedGameDoc, { merge: true });

    console.log(`Updated game: ${gameId} by user: ${currentUserId}`);

    // Convert Date objects to ISO strings for JSON serialization
    const serializedGame = {
      ...updatedGame,
      createdAt: dateToISOString(updatedGame.createdAt),
      updatedAt: dateToISOString(updatedGame.updatedAt),
      expiresAt: dateToISOString(updatedGame.expiresAt),
    };

    return NextResponse.json({
      success: true,
      data: serializedGame as unknown as Game,
    });
  } catch (error) {
    console.error("Update game error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to update game",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 },
    );
  }
}
