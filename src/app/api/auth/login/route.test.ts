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

describe("User Login API Integration Test", () => {
  const testUserIds: string[] = [];
  let testUsername: string;
  let testPassword: string;
  let userId: string;

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
      `Created test user for login test: ${userId} (${testUsername})`,
    );

    // Create user in Firebase Auth
    try {
      await adminAuth.createUser({
        uid: userId,
        displayName: testUsername,
      });
      console.log(`Created user in Firebase Auth: ${userId}`);
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

  it("should login a user with valid credentials", async () => {
    // Create login request
    const testRequestData = {
      username: testUsername,
      password: testPassword,
    };

    const req = createApiRequest("/api/auth/login", "POST", testRequestData);

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
    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data).toBeDefined();
    expect(responseData.data?.user).toBeDefined();
    expect(responseData.data?.token).toBeDefined();
    expect(responseData.data?.user.username).toBe(testUsername);
    expect(responseData.data?.user.id).toBe(userId);
  });

  it("should return error with invalid password", async () => {
    // Create login request with wrong password
    const testRequestData = {
      username: testUsername,
      password: "WrongPassword123!",
    };

    const req = createApiRequest("/api/auth/login", "POST", testRequestData);

    // Execute API
    const response = await POST(req);
    const responseData = await response.json();

    // Verify response
    expect(response.status).toBe(401);
    expect(responseData.success).toBe(false);
    expect(responseData.error.code).toBe("auth_failed");
  });

  it("should return error with non-existent username", async () => {
    // Create login request with non-existent username
    const testRequestData = {
      username: "nonexistent_user",
      password: testPassword,
    };

    const req = createApiRequest("/api/auth/login", "POST", testRequestData);

    // Execute API
    const response = await POST(req);
    const responseData = await response.json();

    // Verify response
    expect(response.status).toBe(401);
    expect(responseData.success).toBe(false);
    expect(responseData.error.code).toBe("auth_failed");
  });
});
