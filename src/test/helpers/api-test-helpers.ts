import { NextRequest } from "next/server";
import { adminAuth, adminFirestore } from "@/lib/firebase/admin";

// Constants
export const TEST_PREFIX = "vitest_";
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

/**
 * Generate a unique test username with date and time format
 * Format: vitest_MMDD_HHMMSS (e.g., vitest_1022143052)
 * Ensures the username is within the 20 character limit (20 chars total)
 */
export const generateTestUsername = (prefix = TEST_PREFIX) => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const testUsername = `${prefix}${month}${day}_${hours}${minutes}${seconds}`;
  console.log(
    "ℹ️ XXX: ~ api-test-helpers.ts ~ generateTestUsername ~ testUsername:",
    testUsername,
  );
  return testUsername;
};

/**
 * Create a NextRequest for API tests
 */
export const createApiRequest = (
  path: string,
  method = "POST",
  body?: Record<string, unknown>,
  headers?: Record<string, string>,
) => {
  return new NextRequest(`${API_BASE_URL}${path}`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
};

/**
 * Clean up test users from both Auth and Firestore
 */
export const cleanupTestUsers = async (userIds: string[]) => {
  const deletePromises = userIds.map(async (uid) => {
    try {
      // Check if user exists in Auth before attempting to delete
      try {
        await adminAuth.getUser(uid);
        await adminAuth.deleteUser(uid);
        console.log(
          `ℹ️ XXX: ~ api-test-helpers.ts ~ Deleted test user from Auth: ${uid}`,
        );
      } catch (error) {
        // User might not exist in Auth if test failed before creation
        console.error(`Failed to delete test user from Auth ${uid}:`, error);
      }

      // Delete from Firestore
      await adminFirestore.collection("users").doc(uid).delete();
      console.log(
        `ℹ️ XXX: ~ api-test-helpers.ts ~ Deleted test user from Firestore: ${uid}`,
      );
    } catch (error) {
      console.error(`Failed to delete test user from Firestore ${uid}:`, error);
    }
  });

  await Promise.all(deletePromises);
};
