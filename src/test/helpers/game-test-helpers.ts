import { adminFirestore } from "@/lib/firebase/admin";
import { TEST_PREFIX } from "./api-test-helpers";

/**
 * Generate a test game title
 */
export const generateTestGameTitle = (prefix = TEST_PREFIX) => {
  const shortTimestamp = Date.now() % 1000000;
  const randomNum = Math.floor(Math.random() * 100);
  return `${prefix}GAME_${shortTimestamp}${randomNum}`;
};

/**
 * Clean up test games from Firestore
 */
export const cleanupTestGames = async (gameIds: string[]) => {
  const deletePromises = gameIds.map(async (gameId) => {
    try {
      // Delete game document
      await adminFirestore.collection("games").doc(gameId).delete();
      console.log(
        `ℹ️ XXX: ~ game-test-helpers.ts ~ Deleted test game from Firestore: ${gameId}`,
      );

      // Delete game board
      const boardDocs = await adminFirestore
        .collection(`games/${gameId}/board`)
        .listDocuments();
      for (const doc of boardDocs) {
        await doc.delete();
      }

      // Delete player boards
      const playerBoardDocs = await adminFirestore
        .collection(`games/${gameId}/playerBoards`)
        .listDocuments();
      for (const doc of playerBoardDocs) {
        await doc.delete();
      }

      // Delete participants
      const participantDocs = await adminFirestore
        .collection(`games/${gameId}/participants`)
        .listDocuments();
      for (const doc of participantDocs) {
        await doc.delete();
      }

      // Delete events
      const eventDocs = await adminFirestore
        .collection(`games/${gameId}/events`)
        .listDocuments();
      for (const doc of eventDocs) {
        await doc.delete();
      }

      // Delete game participations
      const participationQuery = await adminFirestore
        .collection("game_participations")
        .where("gameId", "==", gameId)
        .get();

      for (const doc of participationQuery.docs) {
        await doc.ref.delete();
      }

      console.log(
        `ℹ️ XXX: ~ game-test-helpers.ts ~ Deleted all related collections for game: ${gameId}`,
      );
    } catch (error) {
      console.error(`Failed to delete test game ${gameId}:`, error);
    }
  });

  await Promise.all(deletePromises);
};

/**
 * Generate test cells for a 5x5 bingo board
 */
export const generateTestCells = () => {
  const cells = [];
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      cells.push({
        position: { x, y },
        subject: `Test subject ${x},${y}`,
        isFree: x === 2 && y === 2, // Center cell is free
      });
    }
  }
  return cells;
};
