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
import { GameStatus, LineType, Role } from "@/types/common";
import { playerBoardToFirestore } from "@/types/game";
import type { PlayerBoard } from "@/types/schema";
import { GET, PUT } from "./route";

// Mock Firebase Admin
vi.mock("@/lib/firebase/admin", () => ({
  adminAuth: {
    verifyIdToken: vi.fn(),
  },
  adminFirestore: {
    collection: vi.fn(),
  },
}));

describe("/api/game/[gameId]/playerBoard/[userId]", () => {
  const testUserIds: string[] = [];
  const testGameIds: string[] = [];
  let mockUserId: string;
  let mockGameId: string;
  let mockPlayerBoard: PlayerBoard;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserId = ulid();
    mockGameId = "TEST01";

    // Create mock player board
    mockPlayerBoard = {
      userId: mockUserId,
      cells: [
        {
          id: "cell1",
          position: { x: 0, y: 0 },
          subject: "Test Subject 1",
          isFree: false,
        },
        {
          id: "cell2",
          position: { x: 1, y: 0 },
          subject: "Test Subject 2",
          isFree: false,
        },
      ],
      cellStates: {
        cell1: {
          isOpen: true,
          openedAt: new Date(),
          openedBySubmissionId: "submission1",
        },
        cell2: {
          isOpen: false,
          openedAt: null,
          openedBySubmissionId: null,
        },
      },
      completedLines: [
        {
          type: LineType.ROW,
          index: 0,
          completedAt: new Date(),
        },
      ],
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

  describe("GET", () => {
    it("should return player board for authenticated user", async () => {
      // Setup mocks
      const mockDecodedToken = { uid: mockUserId } as DecodedIdToken;
      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

      const mockGameDoc = {
        exists: true,
        data: () => ({
          id: mockGameId,
          title: generateTestGameTitle(),
          status: GameStatus.ACTIVE,
        }),
      };

      const mockParticipantDoc = {
        exists: true,
        data: () => ({
          userId: mockUserId,
          role: Role.PARTICIPANT,
        }),
      };

      const mockPlayerBoardDoc = {
        exists: true,
        data: () => playerBoardToFirestore(mockPlayerBoard),
      };

      (
        vi.mocked(adminFirestore.collection) as ReturnType<typeof vi.fn>
      ).mockImplementation((path: string) => {
        if (path === "games") {
          return {
            doc: () => ({
              get: () => Promise.resolve(mockGameDoc),
              collection: (subPath: string) => {
                if (subPath === "participants") {
                  return {
                    doc: () => ({
                      get: () => Promise.resolve(mockParticipantDoc),
                    }),
                  };
                }
                if (subPath === "playerBoards") {
                  return {
                    doc: () => ({
                      get: () => Promise.resolve(mockPlayerBoardDoc),
                    }),
                  };
                }
              },
            }),
          };
        }
        return {};
      });

      // Create request
      const request = createApiRequest(
        `/api/game/${mockGameId}/playerBoard/${mockUserId}`,
        "GET",
        undefined,
        { authorization: "Bearer valid-token" },
      );

      // Call API
      const response = (await GET(request, {
        params: Promise.resolve({ gameId: mockGameId, userId: mockUserId }),
      })) as NextResponse<ApiResponse<PlayerBoard>>;

      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(responseData.data?.userId).toBe(mockUserId);
      expect(responseData.data?.cellStates).toBeDefined();
      expect(responseData.data?.completedLines).toHaveLength(1);
    });

    it("should return 401 for missing authorization", async () => {
      const request = createApiRequest(
        `/api/game/${mockGameId}/playerBoard/${mockUserId}`,
        "GET",
      );

      const response = (await GET(request, {
        params: Promise.resolve({ gameId: mockGameId, userId: mockUserId }),
      })) as NextResponse<ApiResponse<PlayerBoard>>;

      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("UNAUTHORIZED");
    });

    it("should return 400 for missing parameters", async () => {
      const request = createApiRequest(
        "/api/game//playerBoard/",
        "GET",
        undefined,
        { authorization: "Bearer valid-token" },
      );

      const response = (await GET(request, {
        params: Promise.resolve({ gameId: "", userId: "" }),
      })) as NextResponse<ApiResponse<PlayerBoard>>;

      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("INVALID_PARAMS");
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

      const request = createApiRequest(
        `/api/game/${mockGameId}/playerBoard/${mockUserId}`,
        "GET",
        undefined,
        { authorization: "Bearer valid-token" },
      );

      const response = (await GET(request, {
        params: Promise.resolve({ gameId: mockGameId, userId: mockUserId }),
      })) as NextResponse<ApiResponse<PlayerBoard>>;

      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("GAME_NOT_FOUND");
    });

    it("should return 404 for non-participant user", async () => {
      const mockDecodedToken = { uid: mockUserId } as DecodedIdToken;
      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

      const mockGameDoc = {
        exists: true,
        data: () => ({
          id: mockGameId,
          title: generateTestGameTitle(),
          status: GameStatus.ACTIVE,
        }),
      };

      const mockParticipantDoc = {
        exists: false,
      };

      (
        vi.mocked(adminFirestore.collection) as ReturnType<typeof vi.fn>
      ).mockImplementation((path: string) => {
        if (path === "games") {
          return {
            doc: () => ({
              get: () => Promise.resolve(mockGameDoc),
              collection: (subPath: string) => {
                if (subPath === "participants") {
                  return {
                    doc: () => ({
                      get: () => Promise.resolve(mockParticipantDoc),
                    }),
                    where: () => ({
                      limit: () => ({
                        get: () =>
                          Promise.resolve({
                            empty: true, // No participants found for query
                            docs: [],
                          }),
                      }),
                    }),
                  };
                }
              },
            }),
          };
        }
        return {};
      });

      const request = createApiRequest(
        `/api/game/${mockGameId}/playerBoard/${mockUserId}`,
        "GET",
        undefined,
        { authorization: "Bearer valid-token" },
      );

      const response = (await GET(request, {
        params: Promise.resolve({ gameId: mockGameId, userId: mockUserId }),
      })) as NextResponse<ApiResponse<PlayerBoard>>;

      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("NOT_PARTICIPANT");
    });

    it("should allow game admin to access other user's board", async () => {
      const adminUserId = ulid();
      const targetUserId = ulid();
      testUserIds.push(adminUserId, targetUserId);

      const mockDecodedToken = { uid: adminUserId } as DecodedIdToken;
      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

      const mockGameDoc = {
        exists: true,
        data: () => ({
          id: mockGameId,
          title: generateTestGameTitle(),
          status: GameStatus.ACTIVE,
        }),
      };

      const mockParticipantDoc = {
        exists: true,
        data: () => ({
          userId: targetUserId,
          role: Role.PARTICIPANT,
        }),
      };

      const mockPlayerBoardDoc = {
        exists: true,
        data: () =>
          playerBoardToFirestore({
            ...mockPlayerBoard,
            userId: targetUserId,
          }),
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

      (
        vi.mocked(adminFirestore.collection) as ReturnType<typeof vi.fn>
      ).mockImplementation((path: string) => {
        if (path === "games") {
          return {
            doc: () => ({
              get: () => Promise.resolve(mockGameDoc),
              collection: (subPath: string) => {
                if (subPath === "participants") {
                  return {
                    doc: () => ({
                      get: () => Promise.resolve(mockParticipantDoc),
                    }),
                    where: () => ({
                      where: () => ({
                        get: () =>
                          Promise.resolve(mockAdminParticipationSnapshot),
                      }),
                    }),
                  };
                }
                if (subPath === "playerBoards") {
                  return {
                    doc: () => ({
                      get: () => Promise.resolve(mockPlayerBoardDoc),
                    }),
                  };
                }
              },
            }),
          };
        }
        return {};
      });

      const request = createApiRequest(
        `/api/game/${mockGameId}/playerBoard/${targetUserId}`,
        "GET",
        undefined,
        { authorization: "Bearer valid-token" },
      );

      const response = (await GET(request, {
        params: Promise.resolve({ gameId: mockGameId, userId: targetUserId }),
      })) as NextResponse<ApiResponse<PlayerBoard>>;

      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data?.userId).toBe(targetUserId);
    });
  });

  describe("PUT", () => {
    it("should update player board for authenticated user", async () => {
      const mockDecodedToken = { uid: mockUserId } as DecodedIdToken;
      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

      const mockGameDoc = {
        exists: true,
        data: () => ({
          id: mockGameId,
          title: generateTestGameTitle(),
          status: GameStatus.ACTIVE,
        }),
      };

      const mockParticipantDoc = {
        exists: true,
        data: () => ({
          userId: mockUserId,
          role: Role.PARTICIPANT,
        }),
      };

      const mockPlayerBoardDoc = {
        exists: true,
        data: () => playerBoardToFirestore(mockPlayerBoard),
      };

      const mockSet = vi.fn().mockResolvedValue(undefined);

      (
        vi.mocked(adminFirestore.collection) as ReturnType<typeof vi.fn>
      ).mockImplementation((path: string) => {
        if (path === "games") {
          return {
            doc: () => ({
              get: () => Promise.resolve(mockGameDoc),
              collection: (subPath: string) => {
                if (subPath === "participants") {
                  return {
                    doc: () => ({
                      get: () => Promise.resolve(mockParticipantDoc),
                    }),
                  };
                }
                if (subPath === "playerBoards") {
                  return {
                    doc: () => ({
                      get: () => Promise.resolve(mockPlayerBoardDoc),
                      set: mockSet,
                    }),
                  };
                }
              },
            }),
          };
        }
        return {};
      });

      const updateData = {
        cellStates: {
          cell3: {
            isOpen: true,
            openedAt: new Date().toISOString(),
            openedBySubmissionId: "submission2",
          },
        },
      };

      const request = createApiRequest(
        `/api/game/${mockGameId}/playerBoard/${mockUserId}`,
        "PUT",
        updateData,
        { authorization: "Bearer valid-token" },
      );

      const response = (await PUT(request, {
        params: Promise.resolve({ gameId: mockGameId, userId: mockUserId }),
      })) as NextResponse<ApiResponse<PlayerBoard>>;

      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(responseData.data?.userId).toBe(mockUserId);
      expect(mockSet).toHaveBeenCalledWith(expect.any(Object), { merge: true });

      // Verify that the merged data contains both existing and new data
      const setCallArgs = mockSet.mock.calls[0][0];
      expect(setCallArgs).toMatchObject({
        userId: mockUserId,
        // Should contain existing cellStates
        cellStates: expect.objectContaining({
          cell1: expect.objectContaining({
            isOpen: true,
            openedBySubmissionId: "submission1",
          }),
          cell2: expect.objectContaining({
            isOpen: false,
            openedBySubmissionId: null,
          }),
          // Should contain new cellState
          cell3: expect.objectContaining({
            isOpen: true,
            openedBySubmissionId: "submission2",
          }),
        }),
        // Should contain existing completedLines
        completedLines: expect.arrayContaining([
          expect.objectContaining({
            type: "row",
            index: 0,
          }),
        ]),
      });
    });

    it("should return 403 when trying to update another user's board", async () => {
      const otherUserId = ulid();
      testUserIds.push(otherUserId);

      const mockDecodedToken = { uid: mockUserId } as DecodedIdToken;
      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

      const updateData = {
        cellStates: {
          cell3: {
            isOpen: true,
            openedAt: new Date().toISOString(),
            openedBySubmissionId: "submission2",
          },
        },
      };

      const request = createApiRequest(
        `/api/game/${mockGameId}/playerBoard/${otherUserId}`,
        "PUT",
        updateData,
        { authorization: "Bearer valid-token" },
      );

      const response = (await PUT(request, {
        params: Promise.resolve({ gameId: mockGameId, userId: otherUserId }),
      })) as NextResponse<ApiResponse<PlayerBoard>>;

      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("FORBIDDEN");
    });

    it("should return 400 for invalid input data", async () => {
      const mockDecodedToken = { uid: mockUserId } as DecodedIdToken;
      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

      const invalidUpdateData = {
        cellStates: {
          cell3: {
            isOpen: "invalid", // Should be boolean
            openedAt: new Date().toISOString(),
            openedBySubmissionId: "submission2",
          },
        },
      };

      const request = createApiRequest(
        `/api/game/${mockGameId}/playerBoard/${mockUserId}`,
        "PUT",
        invalidUpdateData,
        { authorization: "Bearer valid-token" },
      );

      const response = (await PUT(request, {
        params: Promise.resolve({ gameId: mockGameId, userId: mockUserId }),
      })) as NextResponse<ApiResponse<PlayerBoard>>;

      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("INVALID_INPUT");
    });
  });
});
