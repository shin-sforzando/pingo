import { adminAuth } from "@/lib/firebase/admin";
import {
  AdminGameParticipationService,
  AdminGameService,
  AdminSubmissionService,
} from "@/lib/firebase/admin-collections";
import {
  cleanupTestUsers,
  createApiRequest,
} from "@/test/helpers/api-test-helpers";
import {
  cleanupTestGames,
  generateTestGameTitle,
} from "@/test/helpers/game-test-helpers";
import type { ApiResponse } from "@/types/common";
import { GameStatus, ProcessingStatus } from "@/types/common";
import type { Game, Submission } from "@/types/schema";
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

// Mock Admin Services
vi.mock("@/lib/firebase/admin-collections", () => ({
  AdminGameService: {
    getGame: vi.fn(),
    gameExists: vi.fn(),
  },
  AdminGameParticipationService: {
    isParticipant: vi.fn(),
    getSubmissionCount: vi.fn(),
  },
  AdminSubmissionService: {
    createSubmission: vi.fn(),
    getSubmissions: vi.fn(),
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

      const mockGame: Game = {
        id: mockGameId,
        title: generateTestGameTitle(),
        theme: "Test Theme",
        status: GameStatus.ACTIVE,
        creatorId: mockUserId,
        createdAt: new Date(),
        updatedAt: null,
        expiresAt: new Date(Date.now() + 86400000), // 1 day from now
        isPublic: true,
        isPhotoSharingEnabled: true,
        requiredBingoLines: 1,
        confidenceThreshold: 0.7,
        maxSubmissionsPerUser: 10,
        notes: undefined,
      };

      vi.mocked(AdminGameService.getGame).mockResolvedValue(mockGame);
      vi.mocked(AdminGameParticipationService.isParticipant).mockResolvedValue(
        true,
      );
      vi.mocked(
        AdminGameParticipationService.getSubmissionCount,
      ).mockResolvedValue(0);
      vi.mocked(AdminSubmissionService.createSubmission).mockResolvedValue();

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
      expect(AdminSubmissionService.createSubmission).toHaveBeenCalledWith(
        mockGameId,
        expect.any(Object),
      );
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

      vi.mocked(AdminGameService.getGame).mockResolvedValue(null);

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

      const mockGame: Game = {
        id: mockGameId,
        title: generateTestGameTitle(),
        theme: "Test Theme",
        status: GameStatus.ACTIVE,
        creatorId: mockUserId,
        createdAt: new Date(),
        updatedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        isPublic: true,
        isPhotoSharingEnabled: true,
        requiredBingoLines: 1,
        confidenceThreshold: 0.7,
        maxSubmissionsPerUser: 10,
        notes: undefined,
      };

      vi.mocked(AdminGameService.getGame).mockResolvedValue(mockGame);
      vi.mocked(AdminGameParticipationService.isParticipant).mockResolvedValue(
        false,
      );

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

      vi.mocked(AdminGameService.gameExists).mockResolvedValue(true);
      vi.mocked(AdminGameParticipationService.isParticipant).mockResolvedValue(
        true,
      );
      vi.mocked(AdminSubmissionService.getSubmissions).mockResolvedValue([
        mockSubmission,
      ]);

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

      vi.mocked(AdminGameService.gameExists).mockResolvedValue(false);

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
