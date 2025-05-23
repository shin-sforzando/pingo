import { adminFirestore } from "@/lib/firebase/admin";
import {
  type GameBoardDocument,
  type GameDocument,
  gameBoardFromFirestore,
  gameFromFirestore,
} from "@/types/game";
import {
  type Game,
  type GameBoard,
  gameBoardSchema,
  gameSchema,
  userSchema,
} from "@/types/schema";
import { type UserDocument, userFromFirestore } from "@/types/user";

/**
 * Fetch game data by ID
 * @param gameId The ID of the game to fetch
 * @returns The game data or null if not found
 */
export async function getGameData(gameId: string): Promise<Game | null> {
  try {
    const gameDoc = await adminFirestore.collection("games").doc(gameId).get();

    if (!gameDoc.exists) {
      return null;
    }

    const gameData = gameDoc.data();
    if (!gameData) {
      return null;
    }

    // Step 1: Convert Firestore data to application model using the converter function
    const convertedGame = gameFromFirestore({
      ...gameData,
      id: gameDoc.id,
    } as GameDocument);

    // Step 2: Validate the converted data using Zod schema
    // This ensures the data meets all constraints defined in the schema
    try {
      return gameSchema.parse(convertedGame);
    } catch (error) {
      console.error("Game data validation error:", error);
      // Return the converted data anyway, but log the validation error
      return convertedGame;
    }
  } catch (error) {
    console.error("Error fetching game data:", error);
    return null;
  }
}

/**
 * Fetch game board data by game ID
 * @param gameId The ID of the game
 * @returns The game board data or null if not found
 */
export async function getGameBoard(gameId: string): Promise<GameBoard | null> {
  try {
    const boardDoc = await adminFirestore
      .collection(`games/${gameId}/board`)
      .doc("board")
      .get();

    if (!boardDoc.exists) {
      return null;
    }

    const boardData = boardDoc.data();
    if (!boardData) {
      return null;
    }

    // Step 1: Convert Firestore data to application model
    const convertedBoard = gameBoardFromFirestore(
      boardData as GameBoardDocument,
    );

    // Step 2: Validate the converted data
    try {
      return gameBoardSchema.parse(convertedBoard);
    } catch (error) {
      console.error("Game board validation error:", error);
      // Return the converted data anyway, but log the validation error
      return convertedBoard;
    }
  } catch (error) {
    console.error("Error fetching game board:", error);
    return null;
  }
}

/**
 * Participant data with username
 */
export interface Participant {
  id: string;
  username: string;
}

/**
 * Fetch participants for a game
 * @param gameId The ID of the game
 * @returns Array of participants with usernames
 */
export async function getParticipants(gameId: string): Promise<Participant[]> {
  try {
    const participantsSnapshot = await adminFirestore
      .collection(`games/${gameId}/participants`)
      .get();

    if (participantsSnapshot.empty) {
      return [];
    }

    // Get all participant user IDs
    const userIds = participantsSnapshot.docs.map((doc) => doc.id);

    // Fetch user data for each participant
    const participants = await Promise.all(
      userIds.map(async (userId) => {
        const userDoc = await adminFirestore
          .collection("users")
          .doc(userId)
          .get();

        if (!userDoc.exists) {
          return {
            id: userId,
            username: "Unknown User",
          };
        }

        const userData = userDoc.data();
        if (!userData) {
          return {
            id: userId,
            username: "Unknown User",
          };
        }

        // Step 1: Convert Firestore data to application model
        const convertedUser = userFromFirestore({
          ...userData,
          id: userId,
        } as UserDocument);

        // Step 2: Validate the converted data
        try {
          const validatedUser = userSchema.parse(convertedUser);
          return {
            id: userId,
            username: validatedUser.username,
          };
        } catch (error) {
          console.error("User data validation error:", error);
          // Return the converted data anyway, but log the validation error
          return {
            id: userId,
            username: convertedUser.username || "Unknown User",
          };
        }
      }),
    );

    // Sort by username
    return participants.sort((a, b) => a.username.localeCompare(b.username));
  } catch (error) {
    console.error("Error fetching participants:", error);
    return [];
  }
}
