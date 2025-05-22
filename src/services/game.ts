import { adminFirestore } from "@/lib/firebase/admin";
import type { Game, GameBoard, User } from "@/types/schema";

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

    return {
      ...gameDoc.data(),
      id: gameDoc.id,
      createdAt: gameDoc.data()?.createdAt?.toDate() || new Date(),
      expiresAt: gameDoc.data()?.expiresAt?.toDate() || new Date(),
    } as Game;
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

    return boardDoc.data() as GameBoard;
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

        const userData = userDoc.data() as User;

        return {
          id: userId,
          username: userData.username,
        };
      }),
    );

    // Sort by username
    return participants.sort((a, b) => a.username.localeCompare(b.username));
  } catch (error) {
    console.error("Error fetching participants:", error);
    return [];
  }
}
