import type { NextResponse } from "next/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
import {
  cleanupTestUsers,
  createApiRequest,
  generateTestUsername,
} from "@/test/helpers/api-test-helpers";
import {
  cleanupTestGames,
  generateTestCells,
  generateTestGameTitle,
} from "@/test/helpers/game-test-helpers";
import type { ApiResponse } from "@/types/common";
import * as firestoreModule from "@/types/firestore";
import { POST } from "./route";

describe("Game Creation API Integration Test", () => {
  const testUserIds: string[] = [];
  const testGameIds: string[] = [];
  let testUserId: string;
  let testUsername: string;
  let authToken: string;

  // Setup mocks before all tests
  beforeAll(async () => {
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
          uid: testUserId,
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

    // Mock dateToTimestamp to always return AdminTimestamp
    vi.spyOn(firestoreModule, "dateToTimestamp").mockImplementation((date) =>
      firestoreModule.dateToAdminTimestamp(date),
    );

    // Create a test user
    testUsername = generateTestUsername();
    const userRecord = await adminAuth.createUser({
      displayName: testUsername,
    });
    testUserId = userRecord.uid;
    testUserIds.push(testUserId);

    // Create a custom token for authentication
    authToken = await adminAuth.createCustomToken(testUserId);

    // Create user document in Firestore
    await adminFirestore.collection("users").doc(testUserId).set({
      id: testUserId,
      username: testUsername,
      createdAt: new Date(),
      lastLoginAt: null,
      participatingGames: [],
      gameHistory: [],
      isTestUser: true,
    });

    console.log(
      `ℹ️ XXX: ~ route.test.ts ~ Created test user: ${testUserId} (${testUsername})`,
    );
  });

  // Cleanup after all tests
  afterAll(async () => {
    vi.restoreAllMocks();
    await cleanupTestGames(testGameIds);
    await cleanupTestUsers(testUserIds);
  });

  it("should create a new game with valid data", async () => {
    // Create test request data
    const testTitle = generateTestGameTitle();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 1 week from now

    const testRequestData = {
      title: testTitle,
      theme: "Test Theme",
      expiresAt: expiresAt.toISOString(),
      isPublic: true,
      isPhotoSharingEnabled: true,
      skipImageCheck: false,
      requiredBingoLines: 3,
      confidenceThreshold: 0.7,
      notes: "Test notes",
      cells: generateTestCells(),
    };

    // Create request with authentication
    const req = createApiRequest("/api/game/create", "POST", testRequestData, {
      Authorization: `Bearer ${authToken}`,
    });

    // Execute API
    let response: NextResponse;
    let responseData: ApiResponse<{ gameId: string }>;
    try {
      response = await POST(req);
      responseData = await response.json();

      // Debug output
      console.log("ℹ️ XXX: ~ route.test.ts ~ it ~ response:", response);
      console.log("ℹ️ XXX: ~ route.test.ts ~ it ~ responseData:", responseData);
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
    expect(responseData.data?.gameId).toBeDefined();

    // Record created game ID for cleanup
    const gameId = responseData.data?.gameId;
    if (gameId) {
      testGameIds.push(gameId);
      console.log(
        `ℹ️ XXX: ~ route.test.ts ~ Created test game: ${gameId} (${testTitle})`,
      );
    } else {
      expect.fail("Game ID should be defined");
    }

    // Verify data in Firestore
    const gameDoc = await adminFirestore.collection("games").doc(gameId).get();
    expect(gameDoc.exists).toBe(true);

    const gameData = gameDoc.data();
    expect(gameData).toBeDefined();
    expect(gameData?.title).toBe(testTitle);
    expect(gameData?.theme).toBe("Test Theme");
    expect(gameData?.creatorId).toBe(testUserId);
    expect(gameData?.isPublic).toBe(true);
    expect(gameData?.requiredBingoLines).toBe(3);

    // Verify game board
    const boardDoc = await adminFirestore
      .collection(`games/${gameId}/board`)
      .doc("board")
      .get();
    expect(boardDoc.exists).toBe(true);
    expect(boardDoc.data()?.cells).toHaveLength(25);

    // Verify player board
    const playerBoardDoc = await adminFirestore
      .collection(`games/${gameId}/playerBoards`)
      .doc(testUserId)
      .get();
    expect(playerBoardDoc.exists).toBe(true);
    expect(Object.keys(playerBoardDoc.data()?.cellStates || {})).toHaveLength(
      25,
    );

    // Verify participant
    const participantDoc = await adminFirestore
      .collection(`games/${gameId}/participants`)
      .doc(testUserId)
      .get();
    expect(participantDoc.exists).toBe(true);
    expect(participantDoc.data()?.userId).toBe(testUserId);

    // Verify game participation (now in subcollection)
    // The participant document verification above already confirms participation
    // Additional check: verify the participant has creator role
    const participantData = participantDoc.data();
    expect(participantData?.role).toBe("creator");

    // Verify event
    const eventsQuery = await adminFirestore
      .collection(`games/${gameId}/events`)
      .where("type", "==", "game_created")
      .get();
    expect(eventsQuery.empty).toBe(false);
    expect(eventsQuery.docs[0].data().userId).toBe(testUserId);

    // Verify user's participating games
    const userDoc = await adminFirestore
      .collection("users")
      .doc(testUserId)
      .get();
    expect(userDoc.data()?.participatingGames).toContain(gameId);
  });

  it("should return error when not authenticated", async () => {
    // Create test request data without authentication
    const testRequestData = {
      title: generateTestGameTitle(),
      theme: "Test Theme",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isPublic: true,
      isPhotoSharingEnabled: true,
      skipImageCheck: false,
      requiredBingoLines: 3,
      confidenceThreshold: 0.7,
      notes: "Test notes",
      cells: generateTestCells(),
    };

    const req = createApiRequest("/api/game/create", "POST", testRequestData);

    // Execute API
    const response = await POST(req);
    const responseData = await response.json();

    // Verify unauthorized error
    expect(response.status).toBe(401);
    expect(responseData.success).toBe(false);
    expect(responseData.error.code).toBe("auth/unauthorized");
  });

  it("should return error with invalid request data", async () => {
    // Create test request with invalid data (missing required fields)
    const testRequestData = {
      // Missing title
      theme: "Test Theme",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isPublic: true,
      cells: generateTestCells(),
    };

    const req = createApiRequest("/api/game/create", "POST", testRequestData, {
      Authorization: `Bearer ${authToken}`,
    });

    // Execute API
    const response = await POST(req);
    const responseData = await response.json();

    // Verify validation error
    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.error.code).toBe("validation/invalid-input");
  });

  it("should return error with invalid expiration date", async () => {
    // Create test request with past expiration date
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // 1 day in the past

    const testRequestData = {
      title: generateTestGameTitle(),
      theme: "Test Theme",
      expiresAt: pastDate.toISOString(),
      isPublic: true,
      isPhotoSharingEnabled: true,
      skipImageCheck: false,
      requiredBingoLines: 3,
      notes: "Test notes",
      cells: generateTestCells(),
    };

    const req = createApiRequest("/api/game/create", "POST", testRequestData, {
      Authorization: `Bearer ${authToken}`,
    });

    // Execute API
    const response = await POST(req);
    const responseData = await response.json();

    // Verify validation error
    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.error.code).toBe("validation/invalid-input");
  });
});
