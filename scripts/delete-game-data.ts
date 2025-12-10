#!/usr/bin/env tsx
/**
 * Delete game data from Firestore and Storage while preserving user data
 * This script deletes:
 * - Game documents in the 'games' collection (including subcollections)
 * - Files in Cloud Storage under game folders
 * - Clears participatingGames and gameHistory arrays in user documents
 *
 * Usage:
 *   npm run delete-game-data                    # Delete games older than 7 days (default)
 *   npm run delete-game-data -- --days=30       # Delete games older than 30 days
 *   npm run delete-game-data -- --all           # Delete all games
 *   npm run delete-game-data -- --before=2024-12-01  # Delete games before specific date
 */

// Load environment variables before importing Firebase Admin
import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

// Global variables for Firebase modules (initialized in main function)
let FieldValue: typeof import("firebase-admin/firestore").FieldValue;
let Timestamp: typeof import("firebase-admin/firestore").Timestamp;
let getStorage: typeof import("firebase-admin/storage").getStorage;
let adminFirestore: FirebaseFirestore.Firestore;

// Batch size for deletion (Firestore limit is 500 per batch)
const BATCH_SIZE = 500;

// Storage batch size (GCS recommends batching for performance)
const STORAGE_BATCH_SIZE = 100;

// Default days threshold for deletion
const DEFAULT_DAYS_THRESHOLD = 7;

/**
 * Command line options
 */
interface DeleteOptions {
  mode: "days" | "before" | "all";
  days?: number;
  beforeDate?: Date;
}

/**
 * Parse command line arguments
 */
function parseCommandLineArgs(): DeleteOptions {
  const args = process.argv.slice(2);

  // Check for --all flag
  if (args.includes("--all")) {
    return { mode: "all" };
  }

  // Check for --days=N flag
  const daysArg = args.find((arg) => arg.startsWith("--days="));
  if (daysArg) {
    const days = Number.parseInt(daysArg.split("=")[1], 10);
    if (Number.isNaN(days) || days < 0) {
      console.error("❌ Invalid --days value. Must be a positive number.");
      process.exit(1);
    }
    return { mode: "days", days };
  }

  // Check for --before=YYYY-MM-DD flag
  const beforeArg = args.find((arg) => arg.startsWith("--before="));
  if (beforeArg) {
    const dateStr = beforeArg.split("=")[1];
    const beforeDate = new Date(dateStr);
    if (Number.isNaN(beforeDate.getTime())) {
      console.error("❌ Invalid --before date. Use format: YYYY-MM-DD");
      process.exit(1);
    }
    return { mode: "before", beforeDate };
  }

  // Default: delete games older than DEFAULT_DAYS_THRESHOLD days
  return { mode: "days", days: DEFAULT_DAYS_THRESHOLD };
}

/**
 * Format date options as human-readable string
 */
function formatDeleteCriteria(options: DeleteOptions): string {
  switch (options.mode) {
    case "all":
      return "ALL games";
    case "days":
      return `games older than ${options.days} days`;
    case "before":
      return `games created before ${options.beforeDate?.toISOString().split("T")[0]}`;
  }
}

/**
 * Delete a collection in batches
 */
async function deleteCollection(collectionPath: string): Promise<number> {
  const collectionRef = adminFirestore.collection(collectionPath);
  let deletedCount = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const snapshot = await collectionRef.limit(BATCH_SIZE).get();

    if (snapshot.empty) {
      break;
    }

    const batch = adminFirestore.batch();
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
    }

    await batch.commit();
    deletedCount += snapshot.size;
    console.log(`Deleted ${snapshot.size} documents from ${collectionPath}`);

    // Add a small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return deletedCount;
}

/**
 * Delete all subcollections for a document
 */
async function deleteSubcollections(
  docPath: string,
  subcollections: string[],
): Promise<void> {
  for (const subcollection of subcollections) {
    const subcollectionPath = `${docPath}/${subcollection}`;
    const count = await deleteCollection(subcollectionPath);
    console.log(`✓ Deleted ${count} documents from ${subcollectionPath}`);
  }
}

/**
 * Calculate cutoff date based on options
 */
function getCutoffDate(options: DeleteOptions): Date | null {
  switch (options.mode) {
    case "all":
      return null; // No cutoff, delete all
    case "days": {
      const cutoff = new Date();
      cutoff.setDate(
        cutoff.getDate() - (options.days || DEFAULT_DAYS_THRESHOLD),
      );
      return cutoff;
    }
    case "before":
      return options.beforeDate || null;
  }
}

/**
 * Get game IDs matching the delete criteria
 */
async function getGameIdsToDelete(options: DeleteOptions): Promise<string[]> {
  const gamesRef = adminFirestore.collection("games");
  const cutoffDate = getCutoffDate(options);

  let query: FirebaseFirestore.Query = gamesRef;

  // Apply date filter if not deleting all
  if (cutoffDate) {
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);
    query = query.where("createdAt", "<", cutoffTimestamp);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => doc.id);
}

/**
 * Delete game documents with their subcollections based on criteria
 */
async function deleteGames(
  gameIds: string[],
  options: DeleteOptions,
): Promise<number> {
  if (gameIds.length === 0) {
    console.log("No games match the deletion criteria");
    return 0;
  }

  console.log(
    `Found ${gameIds.length} games matching criteria: ${formatDeleteCriteria(options)}`,
  );

  let totalDeleted = 0;

  for (const gameId of gameIds) {
    console.log(`\nDeleting game: ${gameId}`);

    // Delete subcollections first
    await deleteSubcollections(`games/${gameId}`, [
      "participants",
      "submissions",
      "playerBoards",
      "events",
      "board",
    ]);

    // Delete the game document itself
    await adminFirestore.collection("games").doc(gameId).delete();
    console.log(`✓ Deleted game document: ${gameId}`);
    totalDeleted++;

    // Add a small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return totalDeleted;
}

/**
 * Delete all files from Storage for given game IDs
 */
async function deleteStorageFiles(gameIds: string[]): Promise<number> {
  if (gameIds.length === 0) {
    console.log("No game IDs to delete from Storage");
    return 0;
  }

  const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
  if (!bucketName) {
    console.warn(
      "⚠️  GOOGLE_CLOUD_STORAGE_BUCKET not configured, skipping Storage deletion",
    );
    return 0;
  }

  console.log(`\nDeleting files from Storage bucket: ${bucketName}`);

  const storage = getStorage();
  const bucket = storage.bucket(bucketName);

  let totalDeleted = 0;

  for (const gameId of gameIds) {
    console.log(`\nDeleting files for game: ${gameId}`);

    try {
      // List all files with gameId prefix
      const [files] = await bucket.getFiles({
        prefix: `${gameId}/`,
      });

      if (files.length === 0) {
        console.log(`  No files found for game ${gameId}`);
        continue;
      }

      console.log(`  Found ${files.length} files to delete`);

      // Delete files in batches
      for (let i = 0; i < files.length; i += STORAGE_BATCH_SIZE) {
        const batch = files.slice(i, i + STORAGE_BATCH_SIZE);

        await Promise.all(
          batch.map(async (file) => {
            try {
              await file.delete();
              totalDeleted++;
            } catch (error) {
              console.error(`  Failed to delete ${file.name}:`, error);
            }
          }),
        );

        console.log(
          `  Deleted ${Math.min(i + STORAGE_BATCH_SIZE, files.length)}/${files.length} files...`,
        );

        // Add a small delay to avoid rate limiting
        if (i + STORAGE_BATCH_SIZE < files.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      console.log(`  ✓ Deleted all files for game ${gameId}`);
    } catch (error) {
      console.error(`  ❌ Error deleting files for game ${gameId}:`, error);
    }

    // Add delay between games to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return totalDeleted;
}

/**
 * Clear participatingGames and gameHistory from all users
 */
async function clearUserGameData(): Promise<number> {
  const usersRef = adminFirestore.collection("users");
  const snapshot = await usersRef.get();

  if (snapshot.empty) {
    console.log("No users found");
    return 0;
  }

  console.log(`\nFound ${snapshot.size} users to update`);

  const batch = adminFirestore.batch();
  let updateCount = 0;

  for (const userDoc of snapshot.docs) {
    batch.update(userDoc.ref, {
      participatingGames: FieldValue.delete(),
      gameHistory: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    updateCount++;

    // Commit batch when reaching limit
    if (updateCount % BATCH_SIZE === 0) {
      await batch.commit();
      console.log(`Updated ${updateCount} users...`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Commit remaining updates
  if (updateCount % BATCH_SIZE !== 0) {
    await batch.commit();
  }

  console.log(`✓ Cleared game data from ${updateCount} users`);
  return updateCount;
}

/**
 * Main execution
 */
async function main() {
  // Dynamic imports inside async function to ensure environment variables are loaded first
  const firestoreModule = await import("firebase-admin/firestore");
  FieldValue = firestoreModule.FieldValue;
  Timestamp = firestoreModule.Timestamp;

  const storageModule = await import("firebase-admin/storage");
  getStorage = storageModule.getStorage;

  const adminModule = await import("../src/lib/firebase/admin.js");
  adminFirestore = adminModule.adminFirestore;

  // Parse command line options
  const options = parseCommandLineArgs();
  const cutoffDate = getCutoffDate(options);

  console.log("=".repeat(60));
  console.log("🗑️  Delete Game Data from Firestore & Storage");
  console.log("=".repeat(60));
  console.log(`📅 Deletion criteria: ${formatDeleteCriteria(options)}`);
  if (cutoffDate) {
    console.log(`   Cutoff date: ${cutoffDate.toISOString().split("T")[0]}`);
  }
  console.log("⚠️  WARNING: This operation cannot be undone!");
  console.log("⚠️  User accounts will be preserved.");
  console.log("=".repeat(60));

  try {
    // Step 0: Get game IDs matching criteria
    console.log("\n📋 Step 0: Collecting game IDs...");
    const gameIds = await getGameIdsToDelete(options);

    if (gameIds.length === 0) {
      console.log(
        "\n✅ No games match the deletion criteria. Nothing to delete.",
      );
      return;
    }

    console.log(`Found ${gameIds.length} games to delete`);

    // Step 1: Delete files from Storage
    console.log("\n📂 Step 1: Deleting files from Storage...");
    const filesDeleted = await deleteStorageFiles(gameIds);
    console.log(`\n✅ Deleted ${filesDeleted} files from Storage`);

    // Step 2: Delete games from Firestore
    console.log("\n📦 Step 2: Deleting games from Firestore...");
    const gamesDeleted = await deleteGames(gameIds, options);
    console.log(`\n✅ Deleted ${gamesDeleted} games from Firestore`);

    // Step 3: Clear user game data
    console.log("\n👥 Step 3: Clearing user game data...");
    const usersUpdated = await clearUserGameData();
    console.log(`\n✅ Updated ${usersUpdated} users`);

    console.log(`\n${"=".repeat(60)}`);
    console.log("✅ Successfully deleted game data!");
    console.log("=".repeat(60));
    console.log(`Summary:`);
    console.log(`  - Criteria: ${formatDeleteCriteria(options)}`);
    console.log(`  - Storage files deleted: ${filesDeleted}`);
    console.log(`  - Firestore games deleted: ${gamesDeleted}`);
    console.log(`  - Users updated: ${usersUpdated}`);
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}
