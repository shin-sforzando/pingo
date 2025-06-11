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
import { PUT } from "./route";

describe("User Update API Integration Test", () => {
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

    // Mock verifyIdToken to accept custom tokens in tests
    vi.spyOn(adminAuth, "verifyIdToken").mockImplementation(
      async (token: string) => {
        // For test purposes, extract the uid from the custom token
        // In a real app, this would be done by Firebase Auth client SDK
        if (token === "invalid_token") {
          throw new Error("Invalid token");
        }

        // For our test custom token, just return the userId we set
        return {
          uid: userId,
          aud: "test",
          auth_time: 0,
          exp: 0,
          firebase: {
            identities: {},
            sign_in_provider: "custom",
          },
          iat: 0,
          iss: "test",
          sub: "test",
        };
      },
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
      `ℹ️ XXX: ~ route.test.ts ~ Created test user for update API test: ${userId} (${testUsername})`,
    );

    // Create user in Firebase Auth
    try {
      await adminAuth.createUser({
        uid: userId,
        displayName: testUsername,
      });
      console.log(
        `ℹ️ XXX: ~ route.test.ts ~ Created user in Firebase Auth: ${userId}`,
      );

      // Create custom token for authentication
      customToken = await adminAuth.createCustomToken(userId);
      console.log(
        `ℹ️ XXX: ~ route.test.ts ~ Created custom token for user: ${userId}`,
      );
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

  it("should update user password", async () => {
    // Create request with authorization header and update data
    const newPassword = "NewPassword456!";
    const req = createApiRequest(
      "/api/auth/update",
      "PUT",
      {
        userId,
        currentPassword: testPassword,
        newPassword,
      },
      {
        Authorization: `Bearer ${customToken}`,
      },
    );

    // Execute API with try/catch to capture any errors
    let response: NextResponse;
    let responseData: ApiResponse<{ user: User }>;
    try {
      response = await PUT(req);
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
    expect(responseData.data).toBeDefined();
    expect(responseData.data?.user).toBeDefined();
    expect(responseData.data?.user.id).toBe(userId);
    expect(responseData.data?.user.username).toBe(testUsername);

    // Verify password was updated in Firestore
    const userDoc = await adminFirestore.collection("users").doc(userId).get();
    const userData = userDoc.data();
    expect(userData).toBeDefined();

    // Verify new password works
    const passwordMatch = await bcrypt.compare(
      newPassword,
      userData?.passwordHash,
    );
    expect(passwordMatch).toBe(true);
  });

  it("should return error with incorrect current password", async () => {
    // Create request with authorization header and incorrect current password
    const req = createApiRequest(
      "/api/auth/update",
      "PUT",
      {
        userId,
        currentPassword: "WrongPassword123!",
        newPassword: "NewPassword456!",
      },
      {
        Authorization: `Bearer ${customToken}`,
      },
    );

    // Execute API with try/catch to capture any errors
    let response: NextResponse;
    let responseData: ApiResponse<{ user: User }>;
    try {
      response = await PUT(req);
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
    expect(response.status).toBe(401);
    expect(responseData.success).toBe(false);
    expect(responseData.error?.code).toBe("INVALID_PASSWORD");
  });

  it("should succeed even when not authenticated", async () => {
    // Create request without authorization header
    const req = createApiRequest("/api/auth/update", "PUT", {
      userId,
      currentPassword: testPassword,
      newPassword: "NewPassword456!",
    });

    // Execute API with try/catch to capture any errors
    let response: NextResponse;
    let responseData: ApiResponse<{ user: User }>;
    try {
      response = await PUT(req);
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
    expect(responseData.data).toBeDefined();
    expect(responseData.data?.user).toBeDefined();
    expect(responseData.data?.user.id).toBe(userId);
  });
});
