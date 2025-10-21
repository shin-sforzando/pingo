import type { Firestore } from "firebase-admin/firestore";

/**
 * Global setup function - runs before all tests
 * Loads environment variables for Firebase Admin
 */
export async function setup() {
  console.log("🚀 Global setup: Loading environment variables...");

  // Load environment variables using dynamic import to ensure they load before Firebase Admin
  const dotenv = await import("dotenv");
  dotenv.config({ path: ".env" });
  dotenv.config({ path: ".env.local", override: true });

  console.log("✅ Global setup complete");
}

/**
 * Delete all subcollections for a game
 */
async function deleteGameSubcollections(
  gameId: string,
  adminFirestore: Firestore,
) {
  const subcollections = [
    "board",
    "playerBoards",
    "participants",
    "events",
    "submissions",
  ];

  for (const subcollection of subcollections) {
    const docs = await adminFirestore
      .collection(`games/${gameId}/${subcollection}`)
      .listDocuments();

    for (const doc of docs) {
      await doc.delete();
    }
  }
}

/**
 * Global teardown function - runs after all tests complete
 * Cleans up all test users and test games created during test runs
 */
export async function teardown() {
  console.log("🧹 Starting cleanup of all test data...");

  try {
    // Dynamically import Firebase Admin and test helpers
    const { adminAuth, adminFirestore } = await import(
      "./src/lib/firebase/admin"
    );
    const { TEST_PREFIX } = await import("./src/test/helpers/api-test-helpers");

    // Clean up test users
    console.log("🧹 Cleaning up test users...");
    const usersSnapshot = await adminFirestore
      .collection("users")
      .where("isTestUser", "==", true)
      .get();

    console.log(`ℹ️ Found ${usersSnapshot.size} test user(s) to clean up`);

    const userDeletePromises = usersSnapshot.docs.map(async (doc) => {
      const username = doc.data().username;
      const userId = doc.id;

      // Only delete users with the test prefix
      if (username?.startsWith(TEST_PREFIX)) {
        try {
          // Delete from Firebase Auth (ignore if doesn't exist)
          await adminAuth.deleteUser(userId).catch((error) => {
            // User might not exist in Auth, that's ok
            if (error.code !== "auth/user-not-found") {
              console.error(
                `⚠️ Warning: Failed to delete user from Auth: ${userId}`,
                error.message,
              );
            }
          });

          // Delete from Firestore
          await doc.ref.delete();

          console.log(`✅ Deleted test user: ${username} (${userId})`);
        } catch (error) {
          console.error(
            `❌ Failed to delete test user ${username}:`,
            error instanceof Error ? error.message : error,
          );
        }
      }
    });

    await Promise.all(userDeletePromises);

    // Clean up test games
    console.log("🧹 Cleaning up test games...");
    const gamesSnapshot = await adminFirestore.collection("games").get();

    const gameDeletePromises = gamesSnapshot.docs.map(async (doc) => {
      const title = doc.data().title;
      const gameId = doc.id;

      // Only delete games with the test prefix in title
      if (title?.startsWith(`${TEST_PREFIX}GAME_`)) {
        try {
          // Delete all subcollections first
          await deleteGameSubcollections(gameId, adminFirestore);

          // Delete the game document
          await doc.ref.delete();

          console.log(`✅ Deleted test game: ${title} (${gameId})`);
        } catch (error) {
          console.error(
            `❌ Failed to delete test game ${title}:`,
            error instanceof Error ? error.message : error,
          );
        }
      }
    });

    await Promise.all(gameDeletePromises);

    console.log("✨ Test data cleanup complete!");
  } catch (error) {
    console.error(
      "❌ Error during test cleanup:",
      error instanceof Error ? error.message : error,
    );
    // Don't throw - we don't want cleanup failures to fail the test run
  }
}
