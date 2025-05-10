import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Parse command line arguments
const args = process.argv.slice(2);
const prefix = args.includes("--prefix")
  ? args[args.indexOf("--prefix") + 1]
  : "test_";

// Initialize Firebase Admin (if not already initialized)
if (getApps().length === 0) {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error("GOOGLE_APPLICATION_CREDENTIALS environment variable is not set");
    process.exit(1);
  }

  if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
    console.error("GOOGLE_CLOUD_PROJECT_ID environment variable is not set");
    process.exit(1);
  }

  initializeApp({
    credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS as string),
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  });
}

async function cleanupTestData(): Promise<void> {
  console.log(`Starting cleanup of test data (prefix: ${prefix})...`);

  // Find test users in Firestore
  const db = getFirestore();
  const usersRef = db.collection("users");
  const snapshot = await usersRef
    .where("username", ">=", prefix)
    .where("username", "<", `${prefix}\uf8ff`)
    .get();

  if (snapshot.empty) {
    console.log("No test user data to delete");
    return;
  }

  // Get Auth SDK and prepare batch delete
  const auth = getAuth();
  const batch = db.batch();

  // List of user IDs to delete
  const userIds: string[] = [];

  // Add Firestore documents to batch delete
  for (const doc of snapshot.docs) {
    const userData = doc.data();
    userIds.push(userData.id);
    batch.delete(doc.ref);
  }

  // Execute batch delete from Firestore
  await batch.commit();
  console.log(`Deleted ${userIds.length} user records from Firestore`);

  // Delete users from Firebase Authentication
  // Use Promise.allSettled to continue even if some deletions fail
  const authResults = await Promise.allSettled(
    userIds.map((uid) =>
      auth
        .deleteUser(uid)
        .catch((e) =>
          console.warn(`Failed to delete UID ${uid}: ${e.message}`),
        ),
    ),
  );

  const successCount = authResults.filter(
    (r) => r.status === "fulfilled",
  ).length;
  console.log(
    `Deleted ${successCount}/${userIds.length} users from Firebase Auth`,
  );

  console.log("Test data cleanup completed");
}

// Execute script
cleanupTestData().catch((error) => {
  console.error("Error occurred:", error);
  process.exit(1);
});
