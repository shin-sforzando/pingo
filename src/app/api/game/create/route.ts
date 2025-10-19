/**
 * API endpoint for creating a new game
 * POST /api/game/create
 *
 * This endpoint allows authenticated users to create a new game with a unique ID.
 * It creates all necessary documents in Firestore using a transaction to ensure data consistency.
 */
import { FieldValue } from "firebase-admin/firestore";
import { customAlphabet } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { ulid } from "ulid";
import { z } from "zod";
import { GAME_ID_LENGTH } from "../../../../lib/constants";
import { adminAuth, adminFirestore } from "../../../../lib/firebase/admin";
import { AdminGameService } from "../../../../lib/firebase/admin-collections";
import { type ApiResponse, GameStatus, Role } from "../../../../types/common";
import { convertTimestampsToDate } from "../../../../types/firestore";
import {
  cellToFirestore,
  eventToFirestore,
  gameParticipationToFirestore,
  gameToFirestore,
  playerBoardToFirestore,
} from "../../../../types/game";
import {
  type Cell,
  type CompletedLine,
  cellSchema,
  type Event,
  type Game,
  type GameParticipation,
  gameCreationSchema,
  type PlayerBoard,
} from "../../../../types/schema";

// Constants
const PROD_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const TEST_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// Schema for game creation request with cells
const gameCreateSchema = gameCreationSchema.extend({
  cells: z.array(cellSchema.omit({ id: true })).length(25),
});

/**
 * Generate a unique game ID
 * @param isTest Whether to use test alphabet (includes numbers)
 * @returns A unique 6-character game ID
 */
function generateGameId(isTest = false): string {
  const alphabet = isTest ? TEST_ALPHABET : PROD_ALPHABET;
  const nanoid = customAlphabet(alphabet, GAME_ID_LENGTH);
  return nanoid();
}

/**
 * Check if a game ID already exists
 * @param gameId The game ID to check
 * @returns True if the game ID exists, false otherwise
 */
async function gameIdExists(gameId: string): Promise<boolean> {
  return await AdminGameService.gameExists(gameId);
}

/**
 * Generate a unique game ID that doesn't exist in the database
 * @param isTest Whether to use test alphabet (includes numbers)
 * @returns A unique 6-character game ID
 */
async function generateUniqueGameId(isTest = false): Promise<string> {
  let gameId = generateGameId(isTest);
  let attempts = 0;
  const maxAttempts = 10;

  // Check if the game ID already exists, and generate a new one if it does
  while (await gameIdExists(gameId)) {
    gameId = generateGameId(isTest);
    attempts++;

    // Avoid infinite loop in case of high collision rate
    if (maxAttempts <= attempts) {
      throw new Error(
        "Failed to generate a unique game ID after multiple attempts",
      );
    }
  }

  return gameId;
}

/**
 * Create a new game
 *
 * @param request The Next.js request object
 * @returns A response with the created game ID or an error
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<{ gameId: string }>>> {
  try {
    // Verify authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "auth/unauthorized",
            message: "Authentication required",
          },
        },
        { status: 401 },
      );
    }

    // Extract token
    const authToken = authHeader.split("Bearer ")[1];
    if (!authToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "auth/unauthorized",
            message: "Authentication required",
          },
        },
        { status: 401 },
      );
    }

    // Verify the token and get the user ID
    const decodedToken = await adminAuth.verifyIdToken(authToken);
    const userId = decodedToken.uid;

    // Parse and validate request body
    const rawRequestData = await request.json();
    // Convert timestamps to dates using the utility function
    const requestData = convertTimestampsToDate(rawRequestData);
    // Convert string dates to Date objects for validation
    if (requestData.expiresAt && typeof requestData.expiresAt === "string") {
      requestData.expiresAt = new Date(requestData.expiresAt);
    }
    const validationResult = gameCreateSchema.safeParse(requestData);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "validation/invalid-input",
            message: "Invalid input data",
            details: validationResult.error.issues,
          },
        },
        { status: 400 },
      );
    }

    const gameData = validationResult.data;

    // Determine if we're in a test environment
    // For simplicity, we'll consider it a test if the title contains "TEST"
    const isTest = gameData.title.includes("TEST");

    // Generate a unique game ID
    const gameId = await generateUniqueGameId(isTest);

    // Create game document data
    const now = new Date();
    const expiresAt = new Date(gameData.expiresAt);

    // Run in a transaction to ensure all operations succeed or fail together
    await adminFirestore.runTransaction(async (transaction) => {
      // 1. Create the game document
      const gameDocRef = adminFirestore.collection("games").doc(gameId);

      // Create Game model
      const game: Game = {
        id: gameId,
        title: gameData.title,
        theme: gameData.theme,
        creatorId: userId,
        createdAt: now,
        updatedAt: null,
        expiresAt: expiresAt,
        isPublic: gameData.isPublic,
        isPhotoSharingEnabled: gameData.isPhotoSharingEnabled,
        skipImageCheck: gameData.skipImageCheck,
        requiredBingoLines: gameData.requiredBingoLines,
        confidenceThreshold: gameData.confidenceThreshold,
        maxSubmissionsPerUser: gameData.maxSubmissionsPerUser,
        notes: gameData.notes,
        status: GameStatus.ACTIVE,
      };

      // Convert to GameDocument and save
      const gameDoc = gameToFirestore(game);
      transaction.set(gameDocRef, gameDoc);

      // 2. Create the game board
      const boardDocRef = adminFirestore
        .collection(`games/${gameId}/board`)
        .doc("board");

      // Process cells and assign IDs
      const cells: Cell[] = gameData.cells.map((cell, index) => {
        return {
          id: `cell_${index}`,
          position: cell.position,
          subject: cell.subject,
          isFree: cell.isFree || false,
        };
      });

      transaction.set(boardDocRef, {
        cells: cells.map(cellToFirestore),
      });

      // 3. Add the creator as a participant
      const participantDocRef = adminFirestore
        .collection(`games/${gameId}/participants`)
        .doc(userId);

      // Create GameParticipation model
      const participation: GameParticipation = {
        userId,
        gameId,
        role: Role.CREATOR,
        joinedAt: now,
        createdAt: now,
        updatedAt: null,
        completedLines: 0,
        lastCompletedAt: null,
        submissionCount: 0,
      };

      // Convert to GameParticipationDocument and save
      const participantDoc = gameParticipationToFirestore(participation);
      transaction.set(participantDocRef, participantDoc);

      // 4. Create an initial player board for the creator
      const playerBoardDocRef = adminFirestore
        .collection(`games/${gameId}/playerBoards`)
        .doc(userId);

      // Initialize cell states
      const cellStates: Record<
        string,
        {
          isOpen: boolean;
          openedAt: Date | null;
          openedBySubmissionId: string | null;
        }
      > = {};

      for (const cell of cells) {
        cellStates[cell.id] = {
          isOpen: false,
          openedAt: null,
          openedBySubmissionId: null,
        };
      }

      // Create PlayerBoard model
      const playerBoard: PlayerBoard = {
        userId,
        cellStates,
        completedLines: [] as CompletedLine[],
      };

      // Convert to PlayerBoardDocument and save
      const playerBoardDoc = playerBoardToFirestore(playerBoard);
      transaction.set(playerBoardDocRef, playerBoardDoc);

      // 5. Record a game creation event
      const eventId = ulid();
      const eventDocRef = adminFirestore
        .collection(`games/${gameId}/events`)
        .doc(eventId);

      // Create Event model
      const event: Event = {
        id: eventId,
        type: "game_created",
        userId,
        timestamp: now,
        details: {
          gameId,
          title: gameData.title,
        },
        createdAt: now,
        updatedAt: null,
      };

      // Convert to EventDocument and save
      const eventDoc = eventToFirestore(event);
      transaction.set(eventDocRef, eventDoc);

      // 7. Update the user's participating games
      const userDocRef = adminFirestore.collection("users").doc(userId);
      transaction.update(userDocRef, {
        participatingGames: FieldValue.arrayUnion(gameId),
      });
    });

    // Return success response with the game ID
    return NextResponse.json(
      {
        success: true,
        data: {
          gameId: gameId,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error creating game:", error);

    // Handle specific error types
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes("Firebase Auth")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "auth/operation-failed",
              message: error.message,
            },
          },
          { status: 500 },
        );
      }

      if (error.message.includes("Firestore")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "database/operation-failed",
              message: error.message,
            },
          },
          { status: 500 },
        );
      }

      // Generic error with specific message
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "server/internal-error",
            message: error.message,
          },
        },
        { status: 500 },
      );
    }

    // Fallback for unknown error types
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "server/internal-error",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 },
    );
  }
}
