import type { DecodedIdToken } from "firebase-admin/auth";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_GAMES_PER_USER, MAX_PARTICIPANTS_PER_GAME } from "@/lib/constants";
import type { Game, User } from "@/types/schema";
import { POST } from "./route";

// Mock types - include all required fields
type MockUser = Pick<
  User,
  | "id"
  | "username"
  | "participatingGames"
  | "createdAt"
  | "lastLoginAt"
  | "gameHistory"
  | "isTestUser"
> &
  Partial<
    Omit<
      User,
      | "id"
      | "username"
      | "participatingGames"
      | "createdAt"
      | "lastLoginAt"
      | "gameHistory"
      | "isTestUser"
    >
  >;
type MockGame = Pick<
  Game,
  | "id"
  | "title"
  | "theme"
  | "creatorId"
  | "expiresAt"
  | "isPublic"
  | "isPhotoSharingEnabled"
  | "requiredBingoLines"
  | "confidenceThreshold"
  | "maxSubmissionsPerUser"
  | "status"
  | "createdAt"
> &
  Partial<
    Omit<
      Game,
      | "id"
      | "title"
      | "theme"
      | "creatorId"
      | "expiresAt"
      | "isPublic"
      | "isPhotoSharingEnabled"
      | "requiredBingoLines"
      | "confidenceThreshold"
      | "maxSubmissionsPerUser"
      | "status"
      | "createdAt"
    >
  >;

// Mock Firebase Admin
vi.mock("@/lib/firebase/admin", () => ({
  adminAuth: {
    verifyIdToken: vi.fn(),
  },
}));

// Mock Firebase Admin Firestore
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn(),
  FieldValue: {
    arrayUnion: vi.fn((...elements) => ({
      _methodName: "FieldValue.arrayUnion",
      _elements: elements,
    })),
  },
}));

// Mock Firebase Admin Collections
vi.mock("@/lib/firebase/admin-collections", () => ({
  AdminGameService: {
    getGame: vi.fn(),
  },
  AdminUserService: {
    getUser: vi.fn(),
  },
  AdminTransactionService: {
    joinGame: vi.fn(),
  },
}));

// Mock dateToAdminTimestamp
vi.mock("@/types/firestore", () => ({
  dateToAdminTimestamp: vi.fn((date: Date) => ({
    toDate: () => date,
    _seconds: Math.floor(date.getTime() / 1000),
    _nanoseconds: 0,
  })),
}));

describe("POST /api/game/[gameId]/join", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if game ID is missing", async () => {
    const request = new NextRequest("http://localhost/api/game//join", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
      },
    });

    const response = await POST(request, {
      params: Promise.resolve({ gameId: "" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INVALID_PARAMS");
  });

  it("should return 401 if authorization header is missing", async () => {
    const request = new NextRequest("http://localhost/api/game/ABC123/join", {
      method: "POST",
    });

    const response = await POST(request, {
      params: Promise.resolve({ gameId: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("UNAUTHORIZED");
  });

  it("should return 404 if user is not found", async () => {
    const { adminAuth } = await import("@/lib/firebase/admin");
    const { AdminUserService } = await import(
      "@/lib/firebase/admin-collections"
    );

    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "test-user-id",
    } as DecodedIdToken);

    vi.mocked(AdminUserService.getUser).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/game/ABC123/join", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
      },
    });

    const response = await POST(request, {
      params: Promise.resolve({ gameId: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("USER_NOT_FOUND");
  });

  it("should return 404 if game is not found", async () => {
    const { adminAuth } = await import("@/lib/firebase/admin");
    const { AdminUserService, AdminGameService } = await import(
      "@/lib/firebase/admin-collections"
    );

    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "test-user-id",
    } as DecodedIdToken);

    vi.mocked(AdminUserService.getUser).mockResolvedValue({
      id: "test-user-id",
      username: "test-user",
      participatingGames: [],
      createdAt: new Date(),
      lastLoginAt: null,
      gameHistory: [],
      isTestUser: false,
    } as MockUser);

    vi.mocked(AdminGameService.getGame).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/game/ABC123/join", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
      },
    });

    const response = await POST(request, {
      params: Promise.resolve({ gameId: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("GAME_NOT_FOUND");
  });

  it("should return 400 if game has expired", async () => {
    const { adminAuth } = await import("@/lib/firebase/admin");
    const { AdminUserService, AdminGameService } = await import(
      "@/lib/firebase/admin-collections"
    );

    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "test-user-id",
    } as DecodedIdToken);

    vi.mocked(AdminUserService.getUser).mockResolvedValue({
      id: "test-user-id",
      username: "test-user",
      participatingGames: [],
      createdAt: new Date(),
      lastLoginAt: null,
      gameHistory: [],
      isTestUser: false,
    } as MockUser);

    // Set expired date
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1);

    vi.mocked(AdminGameService.getGame).mockResolvedValue({
      id: "ABC123",
      title: "Test Game",
      expiresAt: expiredDate,
      createdAt: new Date(),
    } as MockGame);

    const request = new NextRequest("http://localhost/api/game/ABC123/join", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
      },
    });

    const response = await POST(request, {
      params: Promise.resolve({ gameId: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("GAME_EXPIRED");
  });

  it("should return success with alreadyParticipating flag if user is already participating", async () => {
    const { adminAuth } = await import("@/lib/firebase/admin");
    const { AdminUserService, AdminGameService } = await import(
      "@/lib/firebase/admin-collections"
    );
    const { getFirestore } = await import("firebase-admin/firestore");

    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "test-user-id",
    } as DecodedIdToken);

    vi.mocked(AdminUserService.getUser).mockResolvedValue({
      id: "test-user-id",
      username: "test-user",
      participatingGames: [],
      createdAt: new Date(),
      lastLoginAt: null,
      gameHistory: [],
      isTestUser: false,
    } as MockUser);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    vi.mocked(AdminGameService.getGame).mockResolvedValue({
      id: "ABC123",
      title: "Test Game",
      theme: "Test Theme",
      creatorId: "creator-id",
      expiresAt: futureDate,
      isPublic: true,
      isPhotoSharingEnabled: true,
      requiredBingoLines: 1,
      confidenceThreshold: 0.7,
      maxSubmissionsPerUser: 100,
      status: "active" as const,
      createdAt: new Date(),
    } as MockGame);

    // Mock already participating with existing participation data
    vi.mocked(getFirestore).mockReturnValue({
      collection: vi.fn().mockImplementation((collectionName: string) => {
        if (collectionName === "games") {
          return {
            doc: vi.fn(() => ({
              collection: vi
                .fn()
                .mockImplementation((subCollectionName: string) => {
                  if (subCollectionName === "participants") {
                    return {
                      doc: vi.fn(() => ({
                        get: vi.fn().mockResolvedValue({
                          exists: true, // User is already participating
                          data: () => ({
                            id: "existing-participation-id",
                            gameId: "ABC123",
                            userId: "test-user-id",
                          }),
                        }),
                      })),
                    };
                  }
                  return {};
                }),
            })),
          };
        }
        // Other collections
        return {
          doc: vi.fn(() => ({
            set: vi.fn(),
            update: vi.fn(),
          })),
        };
      }),
    } as unknown as ReturnType<typeof getFirestore>);

    const request = new NextRequest("http://localhost/api/game/ABC123/join", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
      },
    });

    const response = await POST(request, {
      params: Promise.resolve({ gameId: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.participationId).toBe("test-user-id");
    expect(data.data.alreadyParticipating).toBe(true);
  });

  it("should successfully join a game", async () => {
    const { adminAuth } = await import("@/lib/firebase/admin");
    const { AdminUserService, AdminGameService, AdminTransactionService } =
      await import("@/lib/firebase/admin-collections");
    const { getFirestore } = await import("firebase-admin/firestore");

    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "test-user-id",
    } as DecodedIdToken);

    vi.mocked(AdminUserService.getUser).mockResolvedValue({
      id: "test-user-id",
      username: "test-user",
      participatingGames: [],
      createdAt: new Date(),
      lastLoginAt: null,
      gameHistory: [],
      isTestUser: false,
    } as MockUser);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    vi.mocked(AdminGameService.getGame).mockResolvedValue({
      id: "ABC123",
      title: "Test Game",
      theme: "Test Theme",
      creatorId: "creator-id",
      expiresAt: futureDate,
      isPublic: true,
      isPhotoSharingEnabled: true,
      requiredBingoLines: 1,
      confidenceThreshold: 0.7,
      maxSubmissionsPerUser: 100,
      status: "active" as const,
      createdAt: new Date(),
    } as MockGame);

    // Mock user not yet participating
    vi.mocked(getFirestore).mockReturnValue({
      collection: vi.fn().mockImplementation((collectionName: string) => {
        if (collectionName === "games") {
          return {
            doc: vi.fn(() => ({
              collection: vi
                .fn()
                .mockImplementation((subCollectionName: string) => {
                  if (subCollectionName === "participants") {
                    return {
                      doc: vi.fn(() => ({
                        get: vi.fn().mockResolvedValue({
                          exists: false, // User is NOT participating yet
                        }),
                      })),
                    };
                  }
                  return {};
                }),
            })),
          };
        }
        return {};
      }),
    } as unknown as ReturnType<typeof getFirestore>);

    // Mock successful transaction
    vi.mocked(AdminTransactionService.joinGame).mockResolvedValue({
      success: true,
    });

    const request = new NextRequest("http://localhost/api/game/ABC123/join", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
      },
    });

    const response = await POST(request, {
      params: Promise.resolve({ gameId: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty("participationId");
    expect(data.data.participationId).toBeTruthy();

    // Verify transaction was called
    expect(AdminTransactionService.joinGame).toHaveBeenCalledWith(
      "ABC123",
      "test-user-id",
      expect.any(String), // eventId (ULID)
    );
  });

  it("should return 404 if game board is not found", async () => {
    const { adminAuth } = await import("@/lib/firebase/admin");
    const { AdminUserService, AdminGameService, AdminTransactionService } =
      await import("@/lib/firebase/admin-collections");
    const { getFirestore } = await import("firebase-admin/firestore");

    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "test-user-id",
    } as DecodedIdToken);

    vi.mocked(AdminUserService.getUser).mockResolvedValue({
      id: "test-user-id",
      username: "test-user",
      participatingGames: [],
      createdAt: new Date(),
      lastLoginAt: null,
      gameHistory: [],
      isTestUser: false,
    } as MockUser);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    vi.mocked(AdminGameService.getGame).mockResolvedValue({
      id: "ABC123",
      title: "Test Game",
      theme: "Test Theme",
      creatorId: "creator-id",
      expiresAt: futureDate,
      isPublic: true,
      isPhotoSharingEnabled: true,
      requiredBingoLines: 1,
      confidenceThreshold: 0.7,
      maxSubmissionsPerUser: 100,
      status: "active" as const,
      createdAt: new Date(),
    } as MockGame);

    // Mock user not yet participating
    vi.mocked(getFirestore).mockReturnValue({
      collection: vi.fn().mockImplementation((collectionName: string) => {
        if (collectionName === "games") {
          return {
            doc: vi.fn(() => ({
              collection: vi
                .fn()
                .mockImplementation((subCollectionName: string) => {
                  if (subCollectionName === "participants") {
                    return {
                      doc: vi.fn(() => ({
                        get: vi.fn().mockResolvedValue({
                          exists: false, // User is NOT participating yet
                        }),
                      })),
                    };
                  }
                  return {};
                }),
            })),
          };
        }
        return {};
      }),
    } as unknown as ReturnType<typeof getFirestore>);

    // Mock transaction failure due to game board not found
    vi.mocked(AdminTransactionService.joinGame).mockResolvedValue({
      success: false,
      error: "Game board not found",
    });

    const request = new NextRequest("http://localhost/api/game/ABC123/join", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
      },
    });

    const response = await POST(request, {
      params: Promise.resolve({ gameId: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("GAME_BOARD_NOT_FOUND");
    expect(data.error.message).toContain("Game board data is missing");
  });

  it("should reject join when user has reached game history limit", async () => {
    const { adminAuth } = await import("@/lib/firebase/admin");
    const { AdminUserService, AdminGameService } = await import(
      "@/lib/firebase/admin-collections"
    );

    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "test-user-id",
    } as DecodedIdToken);

    // Create user with MAX_GAMES_PER_USER games in history
    const dummyGameIds = Array.from(
      { length: MAX_GAMES_PER_USER },
      (_, i) => `GAME${String(i).padStart(2, "0")}`,
    );

    vi.mocked(AdminUserService.getUser).mockResolvedValue({
      id: "test-user-id",
      username: "test-user",
      participatingGames: [],
      createdAt: new Date(),
      lastLoginAt: null,
      gameHistory: dummyGameIds,
      isTestUser: false,
    } as MockUser);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    vi.mocked(AdminGameService.getGame).mockResolvedValue({
      id: "ABC123",
      title: "Test Game",
      theme: "Test Theme",
      creatorId: "creator-id",
      expiresAt: futureDate,
      isPublic: true,
      isPhotoSharingEnabled: true,
      requiredBingoLines: 1,
      confidenceThreshold: 0.7,
      maxSubmissionsPerUser: 100,
      status: "active" as const,
      createdAt: new Date(),
    } as MockGame);

    const request = new NextRequest("http://localhost/api/game/ABC123/join", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
      },
    });

    const response = await POST(request, {
      params: Promise.resolve({ gameId: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("MAX_GAMES_REACHED");
    expect(data.error.message).toContain(
      `Maximum games limit (${MAX_GAMES_PER_USER})`,
    );
  });

  it("should allow test users to bypass game history limit", async () => {
    const { adminAuth } = await import("@/lib/firebase/admin");
    const { AdminUserService, AdminGameService, AdminTransactionService } =
      await import("@/lib/firebase/admin-collections");
    const { getFirestore } = await import("firebase-admin/firestore");

    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "test-user-id",
    } as DecodedIdToken);

    // Create test user with MAX_GAMES_PER_USER games in history but isTestUser=true
    const dummyGameIds = Array.from(
      { length: MAX_GAMES_PER_USER },
      (_, i) => `GAME${String(i + 10).padStart(2, "0")}`,
    );

    vi.mocked(AdminUserService.getUser).mockResolvedValue({
      id: "test-user-id",
      username: "test-user",
      participatingGames: [],
      createdAt: new Date(),
      lastLoginAt: null,
      gameHistory: dummyGameIds,
      isTestUser: true, // Test user bypasses limit
    } as MockUser);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    vi.mocked(AdminGameService.getGame).mockResolvedValue({
      id: "ABC123",
      title: "Test Game",
      theme: "Test Theme",
      creatorId: "creator-id",
      expiresAt: futureDate,
      isPublic: true,
      isPhotoSharingEnabled: true,
      requiredBingoLines: 1,
      confidenceThreshold: 0.7,
      maxSubmissionsPerUser: 100,
      status: "active" as const,
      createdAt: new Date(),
    } as MockGame);

    // Mock user not yet participating
    vi.mocked(getFirestore).mockReturnValue({
      collection: vi.fn().mockImplementation((collectionName: string) => {
        if (collectionName === "games") {
          return {
            doc: vi.fn(() => ({
              collection: vi
                .fn()
                .mockImplementation((subCollectionName: string) => {
                  if (subCollectionName === "participants") {
                    return {
                      doc: vi.fn(() => ({
                        get: vi.fn().mockResolvedValue({
                          exists: false,
                        }),
                      })),
                    };
                  }
                  return {};
                }),
            })),
          };
        }
        return {};
      }),
    } as unknown as ReturnType<typeof getFirestore>);

    // Mock successful transaction
    vi.mocked(AdminTransactionService.joinGame).mockResolvedValue({
      success: true,
    });

    const request = new NextRequest("http://localhost/api/game/ABC123/join", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
      },
    });

    const response = await POST(request, {
      params: Promise.resolve({ gameId: "ABC123" }),
    });
    const data = await response.json();

    // Should succeed (test users bypass limit)
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should reject join when game has reached participant limit", async () => {
    const { adminAuth } = await import("@/lib/firebase/admin");
    const { AdminUserService, AdminGameService, AdminTransactionService } =
      await import("@/lib/firebase/admin-collections");
    const { getFirestore } = await import("firebase-admin/firestore");

    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "test-user-id",
    } as DecodedIdToken);

    vi.mocked(AdminUserService.getUser).mockResolvedValue({
      id: "test-user-id",
      username: "test-user",
      participatingGames: [],
      createdAt: new Date(),
      lastLoginAt: null,
      gameHistory: [],
      isTestUser: false,
    } as MockUser);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    vi.mocked(AdminGameService.getGame).mockResolvedValue({
      id: "ABC123",
      title: "Test Game",
      theme: "Test Theme",
      creatorId: "creator-id",
      expiresAt: futureDate,
      isPublic: true,
      isPhotoSharingEnabled: true,
      requiredBingoLines: 1,
      confidenceThreshold: 0.7,
      maxSubmissionsPerUser: 100,
      status: "active" as const,
      createdAt: new Date(),
    } as MockGame);

    // Mock user not yet participating
    vi.mocked(getFirestore).mockReturnValue({
      collection: vi.fn().mockImplementation((collectionName: string) => {
        if (collectionName === "games") {
          return {
            doc: vi.fn(() => ({
              collection: vi
                .fn()
                .mockImplementation((subCollectionName: string) => {
                  if (subCollectionName === "participants") {
                    return {
                      doc: vi.fn(() => ({
                        get: vi.fn().mockResolvedValue({
                          exists: false,
                        }),
                      })),
                    };
                  }
                  return {};
                }),
            })),
          };
        }
        return {};
      }),
    } as unknown as ReturnType<typeof getFirestore>);

    // Mock transaction failure due to participant limit
    vi.mocked(AdminTransactionService.joinGame).mockResolvedValue({
      success: false,
      error: `Game has reached the maximum number of participants (${MAX_PARTICIPANTS_PER_GAME})`,
    });

    const request = new NextRequest("http://localhost/api/game/ABC123/join", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
      },
    });

    const response = await POST(request, {
      params: Promise.resolve({ gameId: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("MAX_PARTICIPANTS_REACHED");
    expect(data.error.message).toContain(`maximum number of participants`);
  });

  it("should update gameHistory when joining (tested via integration)", async () => {
    // Note: gameHistory update is handled in AdminTransactionService.joinGame transaction
    // This test verifies the API properly calls the transaction service
    const { adminAuth } = await import("@/lib/firebase/admin");
    const { AdminUserService, AdminGameService, AdminTransactionService } =
      await import("@/lib/firebase/admin-collections");
    const { getFirestore } = await import("firebase-admin/firestore");

    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "test-user-id",
    } as DecodedIdToken);

    vi.mocked(AdminUserService.getUser).mockResolvedValue({
      id: "test-user-id",
      username: "test-user",
      participatingGames: [],
      createdAt: new Date(),
      lastLoginAt: null,
      gameHistory: [],
      isTestUser: false,
    } as MockUser);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    vi.mocked(AdminGameService.getGame).mockResolvedValue({
      id: "ABC123",
      title: "Test Game",
      theme: "Test Theme",
      creatorId: "creator-id",
      expiresAt: futureDate,
      isPublic: true,
      isPhotoSharingEnabled: true,
      requiredBingoLines: 1,
      confidenceThreshold: 0.7,
      maxSubmissionsPerUser: 100,
      status: "active" as const,
      createdAt: new Date(),
    } as MockGame);

    // Mock user not yet participating
    vi.mocked(getFirestore).mockReturnValue({
      collection: vi.fn().mockImplementation((collectionName: string) => {
        if (collectionName === "games") {
          return {
            doc: vi.fn(() => ({
              collection: vi
                .fn()
                .mockImplementation((subCollectionName: string) => {
                  if (subCollectionName === "participants") {
                    return {
                      doc: vi.fn(() => ({
                        get: vi.fn().mockResolvedValue({
                          exists: false,
                        }),
                      })),
                    };
                  }
                  return {};
                }),
            })),
          };
        }
        return {};
      }),
    } as unknown as ReturnType<typeof getFirestore>);

    // Mock successful transaction
    vi.mocked(AdminTransactionService.joinGame).mockResolvedValue({
      success: true,
    });

    const request = new NextRequest("http://localhost/api/game/ABC123/join", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
      },
    });

    const response = await POST(request, {
      params: Promise.resolve({ gameId: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify transaction was called (which includes gameHistory update)
    expect(AdminTransactionService.joinGame).toHaveBeenCalledWith(
      "ABC123",
      "test-user-id",
      expect.any(String),
    );
  });
});
