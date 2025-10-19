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
import { adminAuth } from "@/lib/firebase/admin";
import {
  AdminGameBoardService,
  AdminGameParticipationService,
  AdminGameService,
  AdminPlayerBoardService,
  AdminSubmissionService,
  AdminTransactionService,
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
import { AcceptanceStatus, GameStatus, ProcessingStatus } from "@/types/common";
import type { AnalysisResult, Game, Submission } from "@/types/schema";
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
  AdminGameBoardService: {
    getGameBoard: vi.fn(),
  },
  AdminPlayerBoardService: {
    getPlayerBoard: vi.fn(),
    updatePlayerBoard: vi.fn(),
  },
  AdminSubmissionService: {
    createSubmission: vi.fn(),
    getSubmissions: vi.fn(),
  },
  AdminTransactionService: {
    createSubmissionAndUpdateBoard: vi.fn(),
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
      critique_ja: "",
      critique_en: "",
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

      const mockGameBoard = {
        cells: [
          {
            id: "cell-1",
            subject: "赤い自転車",
            position: { x: 0, y: 0 },
            isFree: false,
          },
        ],
      };

      const mockPlayerBoard = {
        userId: mockUserId,
        cellStates: {},
        completedLines: [],
      };

      vi.mocked(AdminGameService.getGame).mockResolvedValue(mockGame);
      vi.mocked(AdminGameParticipationService.isParticipant).mockResolvedValue(
        true,
      );
      vi.mocked(AdminGameBoardService.getGameBoard).mockResolvedValue(
        mockGameBoard,
      );
      vi.mocked(AdminPlayerBoardService.getPlayerBoard).mockResolvedValue(
        mockPlayerBoard,
      );
      vi.mocked(
        AdminTransactionService.createSubmissionAndUpdateBoard,
      ).mockResolvedValue({ success: true });

      const submissionId = ulid();
      const analysisResult: AnalysisResult = {
        matchedCellId: "cell-1",
        confidence: 0.85,
        critique_ja: "赤い自転車が写真にはっきりと写っています。",
        critique_en: "A red bicycle is clearly visible in the photo.",
        acceptanceStatus: AcceptanceStatus.ACCEPTED,
      };

      const submissionData = {
        submissionId,
        imageUrl: "https://example.com/test-image.jpg",
        analysisResult,
      };

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission`,
        "POST",
        submissionData,
        { authorization: "Bearer valid-token" },
      );

      interface SubmissionResponse {
        newlyCompletedLines: number;
        totalCompletedLines: number;
        requiredBingoLines: number;
      }

      const response = (await POST(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<SubmissionResponse>>;

      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(responseData.data?.requiredBingoLines).toBe(
        mockGame.requiredBingoLines,
      );
      expect(
        AdminTransactionService.createSubmissionAndUpdateBoard,
      ).toHaveBeenCalledWith(
        mockGameId,
        expect.objectContaining({
          id: submissionId,
          userId: mockUserId,
          imageUrl: submissionData.imageUrl,
          acceptanceStatus: AcceptanceStatus.ACCEPTED,
        }),
        expect.objectContaining({
          userId: mockUserId,
          cellStates: expect.objectContaining({
            "cell-1": expect.objectContaining({
              isOpen: true,
            }),
          }),
        }),
        mockUserId,
      );
    });

    it("should return 401 for missing authorization", async () => {
      const submissionId = ulid();
      const analysisResult: AnalysisResult = {
        matchedCellId: "cell-1",
        confidence: 0.85,
        critique_ja: "テスト",
        critique_en: "Test",
        acceptanceStatus: AcceptanceStatus.ACCEPTED,
      };

      const submissionData = {
        submissionId,
        imageUrl: "https://example.com/test-image.jpg",
        analysisResult,
      };

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission`,
        "POST",
        submissionData,
      );

      interface SubmissionResponse {
        newlyCompletedLines: number;
        totalCompletedLines: number;
        requiredBingoLines: number;
      }

      const response = (await POST(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<SubmissionResponse>>;

      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("MISSING_TOKEN");
    });

    it("should return 400 for invalid input data", async () => {
      const mockDecodedToken = { uid: mockUserId } as DecodedIdToken;
      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

      const invalidSubmissionData = {
        submissionId: ulid(),
        imageUrl: "invalid-url", // Should be valid URL
        analysisResult: {
          matchedCellId: "cell-1",
          confidence: 0.85,
          critique_ja: "テスト",
          critique_en: "Test",
          acceptanceStatus: AcceptanceStatus.ACCEPTED,
        },
      };

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission`,
        "POST",
        invalidSubmissionData,
        { authorization: "Bearer valid-token" },
      );

      interface SubmissionResponse {
        newlyCompletedLines: number;
        totalCompletedLines: number;
        requiredBingoLines: number;
      }

      const response = (await POST(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<SubmissionResponse>>;

      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("VALIDATION_ERROR");
    });

    it("should return 404 for non-existent game", async () => {
      const mockDecodedToken = { uid: mockUserId } as DecodedIdToken;
      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

      vi.mocked(AdminGameParticipationService.isParticipant).mockResolvedValue(
        true,
      );
      vi.mocked(AdminGameService.getGame).mockResolvedValue(null);

      const submissionId = ulid();
      const analysisResult: AnalysisResult = {
        matchedCellId: "cell-1",
        confidence: 0.85,
        critique_ja: "テスト",
        critique_en: "Test",
        acceptanceStatus: AcceptanceStatus.ACCEPTED,
      };

      const submissionData = {
        submissionId,
        imageUrl: "https://example.com/test-image.jpg",
        analysisResult,
      };

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission`,
        "POST",
        submissionData,
        { authorization: "Bearer valid-token" },
      );

      interface SubmissionResponse {
        newlyCompletedLines: number;
        totalCompletedLines: number;
        requiredBingoLines: number;
      }

      const response = (await POST(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<SubmissionResponse>>;

      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("GAME_NOT_FOUND");
    });

    it("should return 403 for non-participant user", async () => {
      const mockDecodedToken = { uid: mockUserId } as DecodedIdToken;
      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

      vi.mocked(AdminGameParticipationService.isParticipant).mockResolvedValue(
        false,
      );

      const submissionId = ulid();
      const analysisResult: AnalysisResult = {
        matchedCellId: "cell-1",
        confidence: 0.85,
        critique_ja: "テスト",
        critique_en: "Test",
        acceptanceStatus: AcceptanceStatus.ACCEPTED,
      };

      const submissionData = {
        submissionId,
        imageUrl: "https://example.com/test-image.jpg",
        analysisResult,
      };

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission`,
        "POST",
        submissionData,
        { authorization: "Bearer valid-token" },
      );

      interface SubmissionResponse {
        newlyCompletedLines: number;
        totalCompletedLines: number;
        requiredBingoLines: number;
      }

      const response = (await POST(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<SubmissionResponse>>;

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
