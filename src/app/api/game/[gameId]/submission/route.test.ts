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
import { GameStatus, ProcessingStatus, Role } from "@/types/common";
import { submissionToFirestore } from "@/types/game";
import type { Submission } from "@/types/schema";
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

describe("/api/game/[gameId]/submission", () => {
  const testUserIds: string[] = [];
  const testGameIds: string[] = [];
  let mockUserId: string;
  let mockGameId: string;
  let mockSubmission: Submission;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserId = ulid();
    mockGameId = "TEST01";

    // Create mock submission
    mockSubmission = {
      id: ulid(),
      userId: mockUserId,
      imageUrl: "https://example.com/image.jpg",
      submittedAt: new Date(),
      analyzedAt: null,
      critique: null,
      matchedCellId: null,
      confidence: null,
      processingStatus: ProcessingStatus.UPLOADED,
      acceptanceStatus: null,
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: null,
      memo: "Test submission",
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

  describe("POST", () => {
    it("should create submission for authenticated participant", async () => {
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
                if (subPath === "submissions") {
                  return {
                    doc: () => ({
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

      const submissionData = {
        imageUrl: "https://example.com/test-image.jpg",
        memo: "Test submission memo",
      };

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission`,
        "POST",
        submissionData,
        { authorization: "Bearer valid-token" },
      );

      const response = (await POST(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<Submission>>;

      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(responseData.data?.userId).toBe(mockUserId);
      expect(responseData.data?.imageUrl).toBe(submissionData.imageUrl);
      expect(responseData.data?.memo).toBe(submissionData.memo);
      expect(responseData.data?.processingStatus).toBe(
        ProcessingStatus.UPLOADED,
      );
      expect(mockSet).toHaveBeenCalledWith(expect.any(Object));
    });

    it("should return 401 for missing authorization", async () => {
      const submissionData = {
        imageUrl: "https://example.com/test-image.jpg",
      };

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission`,
        "POST",
        submissionData,
      );

      const response = (await POST(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<Submission>>;

      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("UNAUTHORIZED");
    });

    it("should return 400 for invalid input data", async () => {
      const mockDecodedToken = { uid: mockUserId } as DecodedIdToken;
      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

      const invalidSubmissionData = {
        imageUrl: "invalid-url", // Should be valid URL
      };

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission`,
        "POST",
        invalidSubmissionData,
        { authorization: "Bearer valid-token" },
      );

      const response = (await POST(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<Submission>>;

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

      const submissionData = {
        imageUrl: "https://example.com/test-image.jpg",
      };

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission`,
        "POST",
        submissionData,
        { authorization: "Bearer valid-token" },
      );

      const response = (await POST(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<Submission>>;

      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("GAME_NOT_FOUND");
    });

    it("should return 403 for non-participant user", async () => {
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

      const submissionData = {
        imageUrl: "https://example.com/test-image.jpg",
      };

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission`,
        "POST",
        submissionData,
        { authorization: "Bearer valid-token" },
      );

      const response = (await POST(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<Submission>>;

      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("NOT_PARTICIPANT");
    });
  });

  describe("GET", () => {
    it("should return submissions for authenticated participant", async () => {
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

      const mockSubmissionDoc = submissionToFirestore(mockSubmission);
      const mockSubmissionsSnapshot = {
        docs: [
          {
            data: () => mockSubmissionDoc,
          },
        ],
      };

      const mockQuery = {
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        startAfter: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue(mockSubmissionsSnapshot),
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
                if (subPath === "submissions") {
                  return mockQuery;
                }
              },
            }),
          };
        }
        return {};
      });

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission`,
        "GET",
        undefined,
        { authorization: "Bearer valid-token" },
      );

      const response = (await GET(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<Submission[]>>;

      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(Array.isArray(responseData.data)).toBe(true);
      expect(responseData.data).toHaveLength(1);
      expect(responseData.data?.[0]?.userId).toBe(mockUserId);
    });

    it("should return 401 for missing authorization", async () => {
      const request = createApiRequest(
        `/api/game/${mockGameId}/submission`,
        "GET",
      );

      const response = (await GET(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<Submission[]>>;

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

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission`,
        "GET",
        undefined,
        { authorization: "Bearer valid-token" },
      );

      const response = (await GET(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<Submission[]>>;

      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("GAME_NOT_FOUND");
    });
  });
});
