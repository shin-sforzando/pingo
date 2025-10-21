import { NextRequest } from "next/server";
import { adminAuth, adminFirestore } from "@/lib/firebase/admin";

// Constants
export const TEST_PREFIX = "vitest_";
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

/**
 * Generate a unique test username
 * Ensures the username is within the 20 character limit
 */
export const generateTestUsername = (prefix = TEST_PREFIX) => {
  // Use a shorter timestamp (last 6 digits of timestamp) to keep the username under 20 chars
  const shortTimestamp = Date.now() % 1000000;
  const randomNum = Math.floor(Math.random() * 100);
  const testUsername = `${prefix}${shortTimestamp}${randomNum}`;
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
