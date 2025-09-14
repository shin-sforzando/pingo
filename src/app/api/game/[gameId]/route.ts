import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { validateGameId } from "@/lib/api-utils";
import { adminAuth } from "@/lib/firebase/admin";
import {
  AdminGameParticipationService,
  AdminGameService,
} from "@/lib/firebase/admin-collections";
import type { ApiResponse } from "@/types/common";
import { dateToISOString } from "@/types/firestore";
import type { Game } from "@/types/schema";
import { gameSchema } from "@/types/schema";

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

    const game = await AdminGameService.getGame(gameId);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Return the game data in ApiResponse format
    return NextResponse.json({
      success: true,
      data: game,
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

    // Get current game using data access layer
    const currentGame = await AdminGameService.getGame(gameId);

    if (!currentGame) {
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

    // Check if user can update this game
    const isCreator = currentGame.creatorId === currentUserId;
    let isAdmin = false;

    if (!isCreator) {
      // Check if current user is admin of this game
      isAdmin = await AdminGameParticipationService.isGameAdmin(
        gameId,
        currentUserId,
      );
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

    // Update game using data access layer
    await AdminGameService.updateGame(gameId, updatedGame);

    console.log(
      `ℹ️ XXX: ~ route.ts ~ Updated game: ${gameId} by user: ${currentUserId}`,
    );

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
