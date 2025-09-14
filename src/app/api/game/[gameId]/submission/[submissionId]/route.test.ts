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
import {
  AcceptanceStatus,
  GameStatus,
  ProcessingStatus,
  Role,
} from "@/types/common";
import { submissionToFirestore } from "@/types/game";
import type { Submission } from "@/types/schema";
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

describe("/api/game/[gameId]/submission/[submissionId]", () => {
  const testUserIds: string[] = [];
  const testGameIds: string[] = [];
  let mockUserId: string;
  let mockGameId: string;
  let mockSubmissionId: string;
  let mockSubmission: Submission;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserId = ulid();
    mockGameId = "TEST01";
    mockSubmissionId = ulid();

    // Create mock submission
    mockSubmission = {
      id: mockSubmissionId,
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

  describe("GET", () => {
    it("should return submission for authenticated participant", async () => {
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

      const mockSubmissionDoc = {
        exists: true,
        data: () => submissionToFirestore(mockSubmission),
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
                  return {
                    doc: () => ({
                      get: () => Promise.resolve(mockSubmissionDoc),
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
        `/api/game/${mockGameId}/submission/${mockSubmissionId}`,
        "GET",
        undefined,
        { authorization: "Bearer valid-token" },
      );

      const response = (await GET(request, {
        params: Promise.resolve({
          gameId: mockGameId,
          submissionId: mockSubmissionId,
        }),
      })) as NextResponse<ApiResponse<Submission>>;

      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(responseData.data?.id).toBe(mockSubmissionId);
      expect(responseData.data?.userId).toBe(mockUserId);
    });

    it("should return 401 for missing authorization", async () => {
      const request = createApiRequest(
        `/api/game/${mockGameId}/submission/${mockSubmissionId}`,
        "GET",
      );

      const response = (await GET(request, {
        params: Promise.resolve({
          gameId: mockGameId,
          submissionId: mockSubmissionId,
        }),
      })) as NextResponse<ApiResponse<Submission>>;

      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("UNAUTHORIZED");
    });

    it("should return 404 for non-existent submission", async () => {
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

      const mockSubmissionDoc = {
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
                if (subPath === "submissions") {
                  return {
                    doc: () => ({
                      get: () => Promise.resolve(mockSubmissionDoc),
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
        `/api/game/${mockGameId}/submission/${mockSubmissionId}`,
        "GET",
        undefined,
        { authorization: "Bearer valid-token" },
      );

      const response = (await GET(request, {
        params: Promise.resolve({
          gameId: mockGameId,
          submissionId: mockSubmissionId,
        }),
      })) as NextResponse<ApiResponse<Submission>>;

      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("SUBMISSION_NOT_FOUND");
    });
  });

  describe("PUT", () => {
    it("should update submission for owner", async () => {
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

      const mockSubmissionDoc = {
        exists: true,
        data: () => submissionToFirestore(mockSubmission),
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
                      get: () => Promise.resolve(mockSubmissionDoc),
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
        memo: "Updated memo",
        processingStatus: ProcessingStatus.ANALYZING,
      };

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission/${mockSubmissionId}`,
        "PUT",
        updateData,
        { authorization: "Bearer valid-token" },
      );

      const response = (await PUT(request, {
        params: Promise.resolve({
          gameId: mockGameId,
          submissionId: mockSubmissionId,
        }),
      })) as NextResponse<ApiResponse<Submission>>;

      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(responseData.data?.memo).toBe(updateData.memo);
      expect(responseData.data?.processingStatus).toBe(
        updateData.processingStatus,
      );
      expect(mockSet).toHaveBeenCalledWith(expect.any(Object), { merge: true });
    });

    it("should update submission for game admin", async () => {
      const adminUserId = ulid();
      testUserIds.push(adminUserId);

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
          userId: adminUserId,
          role: Role.ADMIN,
        }),
      };

      const mockSubmissionDoc = {
        exists: true,
        data: () => submissionToFirestore(mockSubmission),
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
                      get: () => Promise.resolve(mockSubmissionDoc),
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
        critique: "AI analysis result",
        confidence: 0.85,
        processingStatus: ProcessingStatus.ANALYZED,
        acceptanceStatus: AcceptanceStatus.ACCEPTED,
        matchedCellId: "cell1",
      };

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission/${mockSubmissionId}`,
        "PUT",
        updateData,
        { authorization: "Bearer valid-token" },
      );

      const response = (await PUT(request, {
        params: Promise.resolve({
          gameId: mockGameId,
          submissionId: mockSubmissionId,
        }),
      })) as NextResponse<ApiResponse<Submission>>;

      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(responseData.data?.critique).toBe(updateData.critique);
      expect(responseData.data?.confidence).toBe(updateData.confidence);
      expect(responseData.data?.processingStatus).toBe(
        updateData.processingStatus,
      );
      expect(responseData.data?.acceptanceStatus).toBe(
        updateData.acceptanceStatus,
      );
      expect(responseData.data?.matchedCellId).toBe(updateData.matchedCellId);
      expect(responseData.data?.analyzedAt).toBeDefined(); // Should be set when status becomes ANALYZED
      expect(mockSet).toHaveBeenCalledWith(expect.any(Object), { merge: true });
    });

    it("should return 403 when non-owner tries to update submission", async () => {
      const otherUserId = ulid();
      testUserIds.push(otherUserId);

      const mockDecodedToken = { uid: otherUserId } as DecodedIdToken;
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
          userId: otherUserId,
          role: Role.PARTICIPANT,
        }),
      };

      const mockSubmissionDoc = {
        exists: true,
        data: () => submissionToFirestore(mockSubmission),
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
                      get: () => Promise.resolve(mockSubmissionDoc),
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
        memo: "Trying to update someone else's submission",
      };

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission/${mockSubmissionId}`,
        "PUT",
        updateData,
        { authorization: "Bearer valid-token" },
      );

      const response = (await PUT(request, {
        params: Promise.resolve({
          gameId: mockGameId,
          submissionId: mockSubmissionId,
        }),
      })) as NextResponse<ApiResponse<Submission>>;

      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("FORBIDDEN");
    });

    it("should return 400 for invalid input data", async () => {
      const mockDecodedToken = { uid: mockUserId } as DecodedIdToken;
      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

      const invalidUpdateData = {
        confidence: 1.5, // Should be between 0 and 1
      };

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission/${mockSubmissionId}`,
        "PUT",
        invalidUpdateData,
        { authorization: "Bearer valid-token" },
      );

      const response = (await PUT(request, {
        params: Promise.resolve({
          gameId: mockGameId,
          submissionId: mockSubmissionId,
        }),
      })) as NextResponse<ApiResponse<Submission>>;

      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("INVALID_INPUT");
    });
  });
});
