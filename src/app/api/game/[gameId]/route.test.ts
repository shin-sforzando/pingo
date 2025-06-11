import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
import {
  cleanupTestUsers,
  createApiRequest,
} from "@/test/helpers/api-test-helpers";
import {
  cleanupTestGames,
  generateTestGameTitle,
} from "@/test/helpers/game-test-helpers";
import type { ApiResponse } from "@/types/common";
import { GameStatus, Role } from "@/types/common";
import { gameToFirestore } from "@/types/game";
import type { Game } from "@/types/schema";
import type { DecodedIdToken } from "firebase-admin/auth";
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

// Mock Firebase Admin
vi.mock("@/lib/firebase/admin", () => ({
  adminAuth: {
    verifyIdToken: vi.fn(),
  },
  adminFirestore: {
    collection: vi.fn(),
  },
}));

describe("/api/game/[gameId] PUT", () => {
  const testUserIds: string[] = [];
  const testGameIds: string[] = [];
  let mockUserId: string;
  let mockGameId: string;
  let mockGame: Game;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserId = ulid();
    mockGameId = "TEST01";

    // Create mock game
    mockGame = {
      id: mockGameId,
      title: generateTestGameTitle(),
      theme: "Test Theme",
      creatorId: mockUserId,
      createdAt: new Date(),
      updatedAt: null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      isPublic: false,
      isPhotoSharingEnabled: true,
      requiredBingoLines: 1,
      confidenceThreshold: 0.5,
      maxSubmissionsPerUser: 30,
      notes: "Test notes",
      status: GameStatus.ACTIVE,
    };

    testUserIds.push(mockUserId);
    testGameIds.push(mockGameId);
  });

  afterEach(async () => {
    await cleanupTestUsers(testUserIds);
    await cleanupTestGames(testGameIds);
    testUserIds.length = 0;
    testGameIds.length = 0;
  });

  afterAll(async () => {
    await cleanupTestUsers(testUserIds);
    await cleanupTestGames(testGameIds);
  });

  it("should update game for creator", async () => {
    const mockDecodedToken = { uid: mockUserId } as DecodedIdToken;
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

    const mockGameDoc = {
      exists: true,
      data: () => gameToFirestore(mockGame),
    };

    const mockSet = vi.fn().mockResolvedValue(undefined);

    (
      vi.mocked(adminFirestore.collection) as ReturnType<typeof vi.fn>
    ).mockImplementation((path: string) => {
      if (path === "games") {
        return {
          doc: () => ({
            get: () => Promise.resolve(mockGameDoc),
            set: mockSet,
          }),
        };
      }
      return {};
    });

    const updateData = {
      title: "Updated Title",
      status: GameStatus.ENDED,
      isPublic: true,
    };

    const request = createApiRequest(
      `/api/game/${mockGameId}`,
      "PUT",
      updateData,
      { authorization: "Bearer valid-token" },
    );

    const response = (await PUT(request, {
      params: Promise.resolve({ gameId: mockGameId }),
    })) as NextResponse<ApiResponse<Game>>;

    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data).toBeDefined();
    expect(responseData.data?.title).toBe(updateData.title);
    expect(responseData.data?.status).toBe(updateData.status);
    expect(responseData.data?.isPublic).toBe(updateData.isPublic);
    expect(responseData.data?.updatedAt).toBeDefined();
    expect(mockSet).toHaveBeenCalledWith(expect.any(Object), { merge: true });
  });

  it("should update game for admin", async () => {
    const adminUserId = ulid();
    testUserIds.push(adminUserId);

    const mockDecodedToken = { uid: adminUserId } as DecodedIdToken;
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

    const mockGameDoc = {
      exists: true,
      data: () => gameToFirestore(mockGame),
    };

    const mockAdminParticipationSnapshot = {
      empty: false,
      docs: [
        {
          data: () => ({
            userId: adminUserId,
            gameId: mockGameId,
            role: Role.ADMIN,
          }),
        },
      ],
    };

    const mockSet = vi.fn().mockResolvedValue(undefined);

    (
      vi.mocked(adminFirestore.collection) as ReturnType<typeof vi.fn>
    ).mockImplementation((path: string) => {
      if (path === "game_participations") {
        return {
          where: () => ({
            where: () => ({
              where: () => ({
                get: () => Promise.resolve(mockAdminParticipationSnapshot),
              }),
            }),
          }),
        };
      }
      if (path === "games") {
        return {
          doc: () => ({
            get: () => Promise.resolve(mockGameDoc),
            set: mockSet,
          }),
        };
      }
      return {};
    });

    const updateData = {
      confidenceThreshold: 0.8,
      requiredBingoLines: 3,
    };

    const request = createApiRequest(
      `/api/game/${mockGameId}`,
      "PUT",
      updateData,
      { authorization: "Bearer valid-token" },
    );

    const response = (await PUT(request, {
      params: Promise.resolve({ gameId: mockGameId }),
    })) as NextResponse<ApiResponse<Game>>;

    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data).toBeDefined();
    expect(responseData.data?.confidenceThreshold).toBe(
      updateData.confidenceThreshold,
    );
    expect(responseData.data?.requiredBingoLines).toBe(
      updateData.requiredBingoLines,
    );
    expect(mockSet).toHaveBeenCalledWith(expect.any(Object), { merge: true });
  });

  it("should return 403 when non-creator/admin tries to update game", async () => {
    const otherUserId = ulid();
    testUserIds.push(otherUserId);

    const mockDecodedToken = { uid: otherUserId } as DecodedIdToken;
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

    const mockGameDoc = {
      exists: true,
      data: () => gameToFirestore(mockGame),
    };

    const mockEmptyParticipationSnapshot = {
      empty: true,
      docs: [],
    };

    (
      vi.mocked(adminFirestore.collection) as ReturnType<typeof vi.fn>
    ).mockImplementation((path: string) => {
      if (path === "game_participations") {
        return {
          where: () => ({
            where: () => ({
              where: () => ({
                get: () => Promise.resolve(mockEmptyParticipationSnapshot),
              }),
            }),
          }),
        };
      }
      if (path === "games") {
        return {
          doc: () => ({
            get: () => Promise.resolve(mockGameDoc),
          }),
        };
      }
      return {};
    });

    const updateData = {
      title: "Trying to update someone else's game",
    };

    const request = createApiRequest(
      `/api/game/${mockGameId}`,
      "PUT",
      updateData,
      { authorization: "Bearer valid-token" },
    );

    const response = (await PUT(request, {
      params: Promise.resolve({ gameId: mockGameId }),
    })) as NextResponse<ApiResponse<Game>>;

    const responseData = await response.json();

    expect(response.status).toBe(403);
    expect(responseData.success).toBe(false);
    expect(responseData.error?.code).toBe("FORBIDDEN");
  });

  it("should return 401 for missing authorization", async () => {
    const updateData = {
      title: "Updated Title",
    };

    const request = createApiRequest(
      `/api/game/${mockGameId}`,
      "PUT",
      updateData,
    );

    const response = (await PUT(request, {
      params: Promise.resolve({ gameId: mockGameId }),
    })) as NextResponse<ApiResponse<Game>>;

    const responseData = await response.json();

    expect(response.status).toBe(401);
    expect(responseData.success).toBe(false);
    expect(responseData.error?.code).toBe("UNAUTHORIZED");
  });

  it("should return 400 for invalid input data", async () => {
    const mockDecodedToken = { uid: mockUserId } as DecodedIdToken;
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

    const invalidUpdateData = {
      confidenceThreshold: 1.5, // Should be between 0 and 1
    };

    const request = createApiRequest(
      `/api/game/${mockGameId}`,
      "PUT",
      invalidUpdateData,
      { authorization: "Bearer valid-token" },
    );

    const response = (await PUT(request, {
      params: Promise.resolve({ gameId: mockGameId }),
    })) as NextResponse<ApiResponse<Game>>;

    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.error?.code).toBe("INVALID_INPUT");
  });

  it("should return 404 for non-existent game", async () => {
    const mockDecodedToken = { uid: mockUserId } as DecodedIdToken;
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

    const mockGameDoc = {
      exists: false,
    };

    (
      vi.mocked(adminFirestore.collection) as ReturnType<typeof vi.fn>
    ).mockImplementation((path: string) => {
      if (path === "games") {
        return {
          doc: () => ({
            get: () => Promise.resolve(mockGameDoc),
          }),
        };
      }
      return {};
    });

    const updateData = {
      title: "Updated Title",
    };

    const request = createApiRequest(
      `/api/game/${mockGameId}`,
      "PUT",
      updateData,
      { authorization: "Bearer valid-token" },
    );

    const response = (await PUT(request, {
      params: Promise.resolve({ gameId: mockGameId }),
    })) as NextResponse<ApiResponse<Game>>;

    const responseData = await response.json();

    expect(response.status).toBe(404);
    expect(responseData.success).toBe(false);
    expect(responseData.error?.code).toBe("GAME_NOT_FOUND");
  });

  it("should handle date transformation for expiresAt", async () => {
    const mockDecodedToken = { uid: mockUserId } as DecodedIdToken;
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

    const mockGameDoc = {
      exists: true,
      data: () => gameToFirestore(mockGame),
    };

    const mockSet = vi.fn().mockResolvedValue(undefined);

    (
      vi.mocked(adminFirestore.collection) as ReturnType<typeof vi.fn>
    ).mockImplementation((path: string) => {
      if (path === "games") {
        return {
          doc: () => ({
            get: () => Promise.resolve(mockGameDoc),
            set: mockSet,
          }),
        };
      }
      return {};
    });

    const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now
    const updateData = {
      expiresAt: futureDate.toISOString(), // Send as ISO string
    };

    const request = createApiRequest(
      `/api/game/${mockGameId}`,
      "PUT",
      updateData,
      { authorization: "Bearer valid-token" },
    );

    const response = (await PUT(request, {
      params: Promise.resolve({ gameId: mockGameId }),
    })) as NextResponse<ApiResponse<Game>>;

    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data).toBeDefined();
    expect(responseData.data?.expiresAt).toBe(futureDate.toISOString());
    expect(mockSet).toHaveBeenCalledWith(expect.any(Object), { merge: true });
  });
});
