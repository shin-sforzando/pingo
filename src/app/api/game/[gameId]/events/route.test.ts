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
import { GameStatus, Role } from "@/types/common";
import type { Event } from "@/types/schema";
import { GET, POST } from "./route";

// Mock Firebase Admin
vi.mock("@/lib/firebase/admin", () => ({
  adminAuth: {
    verifyIdToken: vi.fn(),
  },
  adminFirestore: {
    collection: vi.fn(),
  },
}));

describe("/api/game/[gameId]/events", () => {
  const testUserIds: string[] = [];
  const testGameIds: string[] = [];
  let mockUserId: string;
  let mockGameId: string;
  let mockEvent: Event;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserId = ulid();
    mockGameId = "TEST01";

    // Create mock event
    mockEvent = {
      id: ulid(),
      type: "player_joined",
      userId: mockUserId,
      timestamp: new Date(),
      details: { username: "testuser" },
      createdAt: new Date(),
      updatedAt: null,
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
    it("should return events for authenticated participant", async () => {
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

      const mockEventsSnapshot = {
        empty: false,
        docs: [
          {
            data: () => ({
              id: mockEvent.id,
              type: mockEvent.type,
              userId: mockEvent.userId,
              timestamp: { toDate: () => mockEvent.timestamp },
              details: mockEvent.details,
              createdAt: { toDate: () => mockEvent.createdAt },
              updatedAt: mockEvent.updatedAt,
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
                  };
                }
                if (subPath === "events") {
                  return {
                    orderBy: () => ({
                      limit: () => ({
                        get: () => Promise.resolve(mockEventsSnapshot),
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
        `/api/game/${mockGameId}/events`,
        "GET",
        undefined,
        { authorization: "Bearer valid-token" },
      );

      const response = (await GET(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<Event[]>>;

      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(responseData.data).toHaveLength(1);
      expect(responseData.data?.[0].id).toBe(mockEvent.id);
      expect(responseData.data?.[0].type).toBe(mockEvent.type);
    });

    it("should return 401 for missing authorization", async () => {
      const request = createApiRequest(`/api/game/${mockGameId}/events`, "GET");

      const response = (await GET(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<Event[]>>;

      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("UNAUTHORIZED");
    });

    it("should return 403 for non-participant", async () => {
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
                  };
                }
              },
            }),
          };
        }
        return {};
      });

      const request = createApiRequest(
        `/api/game/${mockGameId}/events`,
        "GET",
        undefined,
        { authorization: "Bearer valid-token" },
      );

      const response = (await GET(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<Event[]>>;

      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("NOT_PARTICIPANT");
    });
  });

  describe("POST", () => {
    it("should create event for authenticated participant", async () => {
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

      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockDocId = ulid();

      (
        vi.mocked(adminFirestore.collection) as ReturnType<typeof vi.fn>
      ).mockImplementation((path: string) => {
        if (path === "games") {
          return {
            doc: (id?: string) => {
              if (id) {
                return {
                  get: () => Promise.resolve(mockGameDoc),
                  collection: (subPath: string) => {
                    if (subPath === "participants") {
                      return {
                        doc: () => ({
                          get: () => Promise.resolve(mockParticipantDoc),
                        }),
                      };
                    }
                    if (subPath === "events") {
                      return {
                        doc: () => ({
                          set: mockSet,
                        }),
                      };
                    }
                  },
                };
              }
              return {
                id: mockDocId,
              };
            },
          };
        }
        return {};
      });

      const eventData = {
        type: "player_action",
        details: { action: "cell_opened", cellId: "cell1" },
      };

      const request = createApiRequest(
        `/api/game/${mockGameId}/events`,
        "POST",
        eventData,
        { authorization: "Bearer valid-token" },
      );

      const response = (await POST(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<Event>>;

      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(responseData.data?.type).toBe(eventData.type);
      expect(responseData.data?.userId).toBe(mockUserId);
      expect(responseData.data?.details).toEqual(eventData.details);
      expect(mockSet).toHaveBeenCalledWith(expect.any(Object));
    });

    it("should return 400 for missing event type", async () => {
      const mockDecodedToken = { uid: mockUserId } as DecodedIdToken;
      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

      const eventData = {
        details: { action: "cell_opened" },
        // Missing type
      };

      const request = createApiRequest(
        `/api/game/${mockGameId}/events`,
        "POST",
        eventData,
        { authorization: "Bearer valid-token" },
      );

      const response = (await POST(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<Event>>;

      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("INVALID_INPUT");
    });

    it("should return 401 for missing authorization", async () => {
      const eventData = {
        type: "player_action",
        details: { action: "cell_opened" },
      };

      const request = createApiRequest(
        `/api/game/${mockGameId}/events`,
        "POST",
        eventData,
      );

      const response = (await POST(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<Event>>;

      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("UNAUTHORIZED");
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

      const eventData = {
        type: "player_action",
        details: { action: "cell_opened" },
      };

      const request = createApiRequest(
        `/api/game/${mockGameId}/events`,
        "POST",
        eventData,
        { authorization: "Bearer valid-token" },
      );

      const response = (await POST(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<Event>>;

      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("GAME_NOT_FOUND");
    });
  });
});
