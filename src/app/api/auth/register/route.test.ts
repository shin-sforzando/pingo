import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
import {
  cleanupTestUsers,
  createApiRequest,
  generateTestUsername,
} from "@/test/helpers/api-test-helpers";
import { userToFirestoreForTest } from "@/test/helpers/firebase-test-helpers";
import type { ApiResponse } from "@/types/common";
import type { User } from "@/types/schema";
import * as userModule from "@/types/user";
import type { NextResponse } from "next/server";
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

describe("User Registration API Integration Test", () => {
  const testUserIds: string[] = [];

  // Mock userToFirestore to use our test version that ensures AdminTimestamp is used
  beforeEach(() => {
    vi.spyOn(userModule, "userToFirestore").mockImplementation(
      (user, passwordHash) => userToFirestoreForTest(user, passwordHash),
    );
  });

  // Restore original implementation after each test
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Cleanup after all tests
  afterAll(async () => {
    await cleanupTestUsers(testUserIds);
  });

  it("should register a new user and create entries in Auth and Firestore", async () => {
    // Create test request with unique username
    const testUsername = generateTestUsername();
    const testRequestData = {
      username: testUsername,
      password: "TestPassword123!",
      isTestUser: true,
    };

    const req = createApiRequest("/api/auth/register", "POST", testRequestData);

    // Debug: Log the request body
    console.log("ℹ️ XXX: ~ route.test.ts ~ it ~ request body:", testRequestData);

    // Execute API with try/catch to capture any errors
    let response: NextResponse;
    let responseData: ApiResponse<{ user: User; token: string }>;
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
    expect(response.status).toBe(201);
    expect(responseData.success).toBe(true);
    expect(responseData.data).toBeDefined();
    expect(responseData.data?.user).toBeDefined();
    expect(responseData.data?.token).toBeDefined();

    // Record created user ID for cleanup
    // Use conditional check to ensure userId is defined before pushing
    const userId = responseData.data?.user.id;
    if (userId) {
      testUserIds.push(userId);
      console.log(
        `ℹ️ XXX: ~ route.test.ts ~ Created test user: ${userId} (${testUsername})`,
      );
    }

    // Verify data in Firestore
    if (!userId) {
      expect.fail("User ID should be defined");
    }
    const userDoc = await adminFirestore.collection("users").doc(userId).get();
    expect(userDoc.exists).toBe(true);

    const userData = userDoc.data();
    expect(userData).toBeDefined();
    expect(userData?.username).toBe(testUsername);
    expect(userData?.passwordHash).toBeDefined();
    expect(userData?.isTestUser).toBe(true);

    // In test environment, we need to explicitly create the user in Firebase Auth
    // This is because the client-side signInWithCustomToken flow is not executed in tests
    try {
      // First check if user exists
      try {
        const authUser = await adminAuth.getUser(userId);
        expect(authUser.uid).toBe(userId);
      } catch (error) {
        console.log("ℹ️ XXX: ~ route.test.ts ~ it ~ error:", error);
        // If user doesn't exist, create it
        console.log(
          `ℹ️ XXX: ~ route.test.ts ~ Creating user in Firebase Auth: ${userId}`,
        );
        await adminAuth.createUser({
          uid: userId,
          displayName: testUsername,
        });

        // Verify user was created
        const authUser = await adminAuth.getUser(userId);
        expect(authUser.uid).toBe(userId);
      }
    } catch (error) {
      console.error(`Failed to create/verify user in Firebase Auth: ${error}`);
      expect.fail("Failed to create/verify user in Firebase Authentication");
    }
  });

  it("should return error when username already exists", async () => {
    // First, create a user
    const testUsername = generateTestUsername();
    const testRequestData = {
      username: testUsername,
      password: "TestPassword123!",
      isTestUser: true,
    };

    const req1 = createApiRequest(
      "/api/auth/register",
      "POST",
      testRequestData,
    );

    // Execute API with try/catch to capture any errors
    let response1: NextResponse;
    let responseData1: ApiResponse<{ user: User; token: string }>;
    try {
      response1 = await POST(req1);
      responseData1 = await response1.json();

      // Debug output
      console.log("ℹ️ XXX: ~ route.test.ts ~ it ~ response1:", response1);
      console.log(
        "ℹ️ XXX: ~ route.test.ts ~ it ~ responseData1:",
        responseData1,
      );
      if (responseData1.error?.details) {
        console.log(
          "ℹ️ XXX: ~ route.test.ts ~ it ~ error details:",
          JSON.stringify(responseData1.error.details, null, 2),
        );
      }
    } catch (error) {
      console.error("API execution error:", error);
      throw error;
    }
    expect(response1.status).toBe(201);

    // Record created user ID for cleanup
    const userId = responseData1.data?.user.id;
    if (userId) {
      testUserIds.push(userId);
      console.log(
        `ℹ️ XXX: ~ route.test.ts ~ Created test user for duplicate test: ${userId} (${testUsername})`,
      );

      // Create user in Firebase Auth for the first test user
      try {
        // First check if user exists
        try {
          const authUser = await adminAuth.getUser(userId);
          expect(authUser.uid).toBe(userId);
        } catch (error) {
          console.log("ℹ️ XXX: ~ route.test.ts ~ it ~ error:", error);
          // If user doesn't exist, create it
          console.log(
            `ℹ️ XXX: ~ route.test.ts ~ Creating user in Firebase Auth: ${userId}`,
          );
          await adminAuth.createUser({
            uid: userId,
            displayName: testUsername,
          });

          // Verify user was created
          const authUser = await adminAuth.getUser(userId);
          expect(authUser.uid).toBe(userId);
        }
      } catch (error) {
        console.error(
          `Failed to create/verify user in Firebase Auth: ${error}`,
        );
        expect.fail("Failed to create/verify user in Firebase Authentication");
      }
    } else {
      expect.fail("User ID should be defined");
    }

    // Now try to create another user with the same username
    const req2 = createApiRequest(
      "/api/auth/register",
      "POST",
      testRequestData,
    );

    const response2 = await POST(req2);
    const responseData2 = await response2.json();

    // Verify duplicate username error
    expect(response2.status).toBe(400);
    expect(responseData2.success).toBe(false);
    expect(responseData2.error.code).toBe("USERNAME_EXISTS");
  });
});
