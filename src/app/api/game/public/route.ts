import { NextResponse } from "next/server";
import { MAX_PARTICIPANTS_PER_GAME } from "@/lib/constants";
import { adminAuth } from "@/lib/firebase/admin";
import {
  AdminGameParticipationService,
  AdminGameService,
  AdminUserService,
} from "@/lib/firebase/admin-collections";
import type { ApiResponse } from "@/types/common";
import type { Game } from "@/types/schema";

/**
 * GET handler for fetching public games
 */
export async function GET(request: Request): Promise<
  NextResponse<
    ApiResponse<{
      games: Array<
        Partial<Game> & {
          isParticipating?: boolean;
          participantCount: number;
        }
      >;
    }>
  >
> {
  try {
    // Optional authentication to check participation status
    let userId: string | null = null;
    let userParticipatingGames: string[] = [];

    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const idToken = authHeader.substring(7);
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        userId = decodedToken.uid;

        // Get user's participating games
        const user = await AdminUserService.getUser(userId);
        if (user) {
          userParticipatingGames = user.participatingGames || [];
        }
      } catch {
        // Authentication is optional for this endpoint
      }
    }

    // Get all public active games (already filtered for expiration)
    const publicGames = await AdminGameService.getPublicGames();

    // Build response with additional data
    const gamesWithMetadata = await Promise.all(
      publicGames.map(async (game) => {
        // Get participant count for each game
        const participantCount =
          await AdminGameParticipationService.getParticipantCount(game.id);

        // Exclude full games from the list
        if (participantCount >= MAX_PARTICIPANTS_PER_GAME) {
          return null;
        }

        const gameData: Partial<Game> & {
          isParticipating?: boolean;
          participantCount: number;
        } = {
          id: game.id,
          title: game.title,
          theme: game.theme,
          creatorId: game.creatorId,
          expiresAt: game.expiresAt,
          requiredBingoLines: game.requiredBingoLines,
          confidenceThreshold: game.confidenceThreshold,
          maxSubmissionsPerUser: game.maxSubmissionsPerUser,
          isPhotoSharingEnabled: game.isPhotoSharingEnabled,
          isPublic: game.isPublic,
          notes: game.notes,
          createdAt: game.createdAt,
          participantCount,
        };

        // Add participation flag if user is authenticated
        if (userId) {
          gameData.isParticipating = userParticipatingGames.includes(game.id);
        }

        return gameData;
      }),
    );

    // Filter out null entries (full games)
    const availableGames = gamesWithMetadata.filter(
      (game): game is NonNullable<typeof game> => game !== null,
    );

    // Sort by creation date (newest first)
    availableGames.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      data: { games: availableGames },
    });
  } catch (error) {
    console.error("Error fetching public games:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to fetch public games",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 },
    );
  }
}
