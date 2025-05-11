import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
import {
  cleanupTestUsers,
  createApiRequest,
  generateTestUsername,
} from "@/test/helpers/api-test-helpers";
import { userToFirestoreForTest } from "@/test/helpers/firebase-test-helpers";
import type { ApiResponse } from "@/types/common";
import * as firestoreModule from "@/types/firestore";
import type { User } from "@/types/schema";
import * as userModule from "@/types/user";
import bcrypt from "bcrypt";
import type { NextResponse } from "next/server";
import { ulid } from "ulid";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { POST } from "./route";

describe("User Logout API Integration Test", () => {
  const testUserIds: string[] = [];
  let testUsername: string;
  let testPassword: string;
  let userId: string;
  let customToken: string;

  beforeEach(async () => {
    // Mock userToFirestore to use our test version that ensures AdminTimestamp is used
    vi.spyOn(userModule, "userToFirestore").mockImplementation(
      (user, passwordHash) => userToFirestoreForTest(user, passwordHash),
    );

    // Mock dateToTimestamp to always return AdminTimestamp
    vi.spyOn(firestoreModule, "dateToTimestamp").mockImplementation((date) =>
      firestoreModule.dateToAdminTimestamp(date),
    );

    // Create test user data
    testUsername = generateTestUsername();
    testPassword = "TestPassword123!";
    userId = ulid();
    testUserIds.push(userId);

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(testPassword, saltRounds);

    // Create user data
    const now = new Date();
    const user: User = {
      id: userId,
      username: testUsername,
      createdAt: now,
      updatedAt: null,
      lastLoginAt: now,
      participatingGames: [],
      gameHistory: [],
      isTestUser: true,
    };

    // Save user data to Firestore
    const userDoc = userToFirestoreForTest(user, passwordHash);
    await adminFirestore.collection("users").doc(userId).set(userDoc);
    console.log(
      `Created test user for logout API test: ${userId} (${testUsername})`,
    );

    // Create user in Firebase Auth
    try {
      await adminAuth.createUser({
        uid: userId,
        displayName: testUsername,
      });
      console.log(`Created user in Firebase Auth: ${userId}`);

      // Create custom token for authentication
      customToken = await adminAuth.createCustomToken(userId);
      console.log(`Created custom token for user: ${userId}`);
    } catch (error) {
      console.error(`Failed to create user in Firebase Auth: ${error}`);
      throw error;
    }
  });

  // Restore original implementation after each test
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Cleanup after all tests
  afterAll(async () => {
    await cleanupTestUsers(testUserIds);
  });

  it("should successfully logout a user", async () => {
    // Create request with authorization header and userId
    const req = createApiRequest(
      "/api/auth/logout",
      "POST",
      { userId },
      {
        Authorization: `Bearer ${customToken}`,
      },
    );

    // Execute API with try/catch to capture any errors
    let response: NextResponse;
    let responseData: ApiResponse<null>;
    try {
      response = await POST(req);
      responseData = await response.json();

      // Debug output
      console.log("ℹ️ XXX: ~ route.test.ts ~ it ~ response:", response);
      console.log("ℹ️ XXX: ~ route.test.ts ~ it ~ responseData:", responseData);
      if (responseData.error?.details) {
        console.log(
          "ℹ️ XXX: ~ route.test.ts ~ it ~ error details:",
          JSON.stringify(responseData.error.details, null, 2),
        );
      }
    } catch (error) {
      console.error(
        "ℹ️ XXX: ~ route.test.ts ~ it ~ API execution error:",
        error,
      );
      throw error;
    }

    // Verify response
    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
  });

  it("should return success even when not authenticated", async () => {
    // Create request without authorization header but with userId
    const req = createApiRequest("/api/auth/logout", "POST", { userId });

    // Execute API with try/catch to capture any errors
    let response: NextResponse;
    let responseData: ApiResponse<null>;
    try {
      response = await POST(req);
      responseData = await response.json();

      // Debug output
      console.log("ℹ️ XXX: ~ route.test.ts ~ it ~ response:", response);
      console.log("ℹ️ XXX: ~ route.test.ts ~ it ~ responseData:", responseData);
      if (responseData.error?.details) {
        console.log(
          "ℹ️ XXX: ~ route.test.ts ~ it ~ error details:",
          JSON.stringify(responseData.error.details, null, 2),
        );
      }
    } catch (error) {
      console.error(
        "ℹ️ XXX: ~ route.test.ts ~ it ~ API execution error:",
        error,
      );
      throw error;
    }

    // Verify response - logout should always succeed even without auth
    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
  });
});
