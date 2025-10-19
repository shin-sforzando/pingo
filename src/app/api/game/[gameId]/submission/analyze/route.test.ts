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
import type { AnalysisResult, Cell, Game, Submission } from "@/types/schema";
import { POST } from "./route";

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
  },
  AdminGameParticipationService: {
    isParticipant: vi.fn(),
  },
  AdminSubmissionService: {
    getSubmission: vi.fn(),
    updateSubmission: vi.fn(),
  },
  AdminGameBoardService: {
    getGameBoard: vi.fn(),
  },
  AdminPlayerBoardService: {
    getPlayerBoard: vi.fn(),
    updatePlayerBoard: vi.fn(),
  },
}));

// Mock Google GenAI
let mockGenerateContent: ReturnType<typeof vi.fn>;

vi.mock("@google/genai", () => {
  const mockFn = vi.fn();
  return {
    GoogleGenAI: vi.fn(() => ({
      models: {
        generateContent: mockFn,
      },
    })),
    Type: {
      OBJECT: "OBJECT",
      STRING: "STRING",
      NUMBER: "NUMBER",
    },
    __getMockGenerateContent: () => mockFn,
  };
});

// Mock global fetch for image fetching
global.fetch = vi.fn();

describe("/api/game/[gameId]/submission/analyze", () => {
  const testUserIds: string[] = [];
  const testGameIds: string[] = [];
  let mockUserId: string;
  let mockGameId: string;
  let mockSubmissionId: string;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get the mock function from the mocked module
    const genAI = await import("@google/genai");
    type MockedGenAI = typeof genAI & {
      __getMockGenerateContent: () => ReturnType<typeof vi.fn>;
    };
    mockGenerateContent = (genAI as MockedGenAI).__getMockGenerateContent();
    mockGenerateContent.mockClear();

    mockUserId = ulid();
    mockGameId = "TEST01";
    mockSubmissionId = ulid();

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
    const mockGame: Game = {
      id: "TEST01",
      title: generateTestGameTitle(),
      theme: "Test Theme",
      status: GameStatus.ACTIVE,
      creatorId: ulid(),
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

    const mockCells: Cell[] = [
      {
        id: "cell-1",
        position: { x: 0, y: 0 },
        subject: "赤い自転車",
        isFree: false,
      },
      {
        id: "cell-2",
        position: { x: 1, y: 0 },
        subject: "青いポスト",
        isFree: false,
      },
    ];

    const mockSubmission: Submission = {
      id: mockSubmissionId,
      userId: mockUserId,
      imageUrl: "https://example.com/test-image.jpg",
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

    it("should analyze image and return bilingual critique with match", async () => {
      const mockDecodedToken = { uid: mockUserId } as DecodedIdToken;
      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

      vi.mocked(AdminGameParticipationService.isParticipant).mockResolvedValue(
        true,
      );
      vi.mocked(AdminGameService.getGame).mockResolvedValue(mockGame);
      vi.mocked(AdminGameBoardService.getGameBoard).mockResolvedValue({
        cells: mockCells,
      });
      vi.mocked(AdminPlayerBoardService.getPlayerBoard).mockResolvedValue({
        userId: mockUserId,
        cellStates: {},
        completedLines: [],
      });
      vi.mocked(AdminSubmissionService.getSubmission).mockResolvedValue(
        mockSubmission,
      );
      vi.mocked(AdminSubmissionService.updateSubmission).mockResolvedValue();
      vi.mocked(AdminPlayerBoardService.updatePlayerBoard).mockResolvedValue();

      // Mock Gemini API response with bilingual critique
      const mockGeminiResponse = {
        matchedCellId: "cell-1",
        confidence: 0.85,
        critique_ja: "赤い自転車が写真にはっきりと写っています。",
        critique_en: "A red bicycle is clearly visible in the photo.",
        acceptanceStatus: AcceptanceStatus.ACCEPTED,
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockGeminiResponse),
      });

      // Mock fetch for image
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(0),
      } as Response);

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission/analyze`,
        "POST",
        {
          submissionId: mockSubmissionId,
          imageUrl: "https://example.com/test-image.jpg",
        },
        { authorization: "Bearer valid-token" },
      );

      const response = (await POST(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<AnalysisResult>>;

      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(responseData.data?.matchedCellId).toBe("cell-1");
      expect(responseData.data?.confidence).toBe(0.85);
      expect(responseData.data?.critique_ja).toBe(
        "赤い自転車が写真にはっきりと写っています。",
      );
      expect(responseData.data?.critique_en).toBe(
        "A red bicycle is clearly visible in the photo.",
      );
      expect(responseData.data?.acceptanceStatus).toBe(
        AcceptanceStatus.ACCEPTED,
      );

      // Note: State updates are handled by /api/game/[gameId]/submission endpoint
      // This endpoint only performs analysis
    });

    it("should return bilingual critique when no cells match", async () => {
      const mockDecodedToken = { uid: mockUserId } as DecodedIdToken;
      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

      vi.mocked(AdminGameParticipationService.isParticipant).mockResolvedValue(
        true,
      );
      vi.mocked(AdminGameService.getGame).mockResolvedValue(mockGame);
      vi.mocked(AdminGameBoardService.getGameBoard).mockResolvedValue({
        cells: mockCells,
      });
      vi.mocked(AdminPlayerBoardService.getPlayerBoard).mockResolvedValue({
        userId: mockUserId,
        cellStates: {},
        completedLines: [],
      });
      vi.mocked(AdminSubmissionService.getSubmission).mockResolvedValue(
        mockSubmission,
      );
      vi.mocked(AdminSubmissionService.updateSubmission).mockResolvedValue();

      // Mock Gemini API response with no match
      const mockGeminiResponse = {
        matchedCellId: null,
        confidence: 0.3,
        critique_ja: "写真には指定された被写体が見つかりませんでした。",
        critique_en: "The specified subject was not found in the photo.",
        acceptanceStatus: AcceptanceStatus.NO_MATCH,
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockGeminiResponse),
      });

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(0),
      } as Response);

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission/analyze`,
        "POST",
        {
          submissionId: mockSubmissionId,
          imageUrl: "https://example.com/test-image.jpg",
        },
        { authorization: "Bearer valid-token" },
      );

      const response = (await POST(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<AnalysisResult>>;

      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data?.matchedCellId).toBe(null);
      expect(responseData.data?.critique_ja).toBe(
        "写真には指定された被写体が見つかりませんでした。",
      );
      expect(responseData.data?.critique_en).toBe(
        "The specified subject was not found in the photo.",
      );
      expect(responseData.data?.acceptanceStatus).toBe(
        AcceptanceStatus.NO_MATCH,
      );

      // Verify cell state was NOT updated
      expect(AdminPlayerBoardService.updatePlayerBoard).not.toHaveBeenCalled();
    });

    it("should return bilingual message when all cells are already open", async () => {
      const mockDecodedToken = { uid: mockUserId } as DecodedIdToken;
      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

      vi.mocked(AdminGameParticipationService.isParticipant).mockResolvedValue(
        true,
      );
      vi.mocked(AdminGameService.getGame).mockResolvedValue(mockGame);
      vi.mocked(AdminGameBoardService.getGameBoard).mockResolvedValue({
        cells: mockCells,
      });

      // All cells are already open
      vi.mocked(AdminPlayerBoardService.getPlayerBoard).mockResolvedValue({
        userId: mockUserId,
        cellStates: {
          "cell-1": {
            isOpen: true,
            openedAt: new Date(),
            openedBySubmissionId: ulid(),
          },
          "cell-2": {
            isOpen: true,
            openedAt: new Date(),
            openedBySubmissionId: ulid(),
          },
        },
        completedLines: [],
      });
      vi.mocked(AdminSubmissionService.getSubmission).mockResolvedValue(
        mockSubmission,
      );
      vi.mocked(AdminSubmissionService.updateSubmission).mockResolvedValue();

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission/analyze`,
        "POST",
        {
          submissionId: mockSubmissionId,
          imageUrl: "https://example.com/test-image.jpg",
        },
        { authorization: "Bearer valid-token" },
      );

      const response = (await POST(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<AnalysisResult>>;

      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data?.matchedCellId).toBe(null);
      expect(responseData.data?.confidence).toBe(0);
      expect(responseData.data?.critique_ja).toBe(
        "すべてのセルが開かれています。分析は不要です。",
      );
      expect(responseData.data?.critique_en).toBe(
        "All cells are already opened. No analysis needed.",
      );
      expect(responseData.data?.acceptanceStatus).toBe(
        AcceptanceStatus.NO_MATCH,
      );
    });

    it("should not update cell when confidence is below threshold", async () => {
      const mockDecodedToken = { uid: mockUserId } as DecodedIdToken;
      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

      vi.mocked(AdminGameParticipationService.isParticipant).mockResolvedValue(
        true,
      );
      vi.mocked(AdminGameService.getGame).mockResolvedValue(mockGame);
      vi.mocked(AdminGameBoardService.getGameBoard).mockResolvedValue({
        cells: mockCells,
      });
      vi.mocked(AdminPlayerBoardService.getPlayerBoard).mockResolvedValue({
        userId: mockUserId,
        cellStates: {},
        completedLines: [],
      });
      vi.mocked(AdminSubmissionService.getSubmission).mockResolvedValue(
        mockSubmission,
      );
      vi.mocked(AdminSubmissionService.updateSubmission).mockResolvedValue();

      // Mock Gemini API response with low confidence
      const mockGeminiResponse = {
        matchedCellId: "cell-1",
        confidence: 0.5, // Below threshold (0.7)
        critique_ja: "赤い自転車らしきものが見えますが、確信が持てません。",
        critique_en:
          "Something that looks like a red bicycle is visible, but I'm not confident.",
        acceptanceStatus: AcceptanceStatus.ACCEPTED,
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockGeminiResponse),
      });

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(0),
      } as Response);

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission/analyze`,
        "POST",
        {
          submissionId: mockSubmissionId,
          imageUrl: "https://example.com/test-image.jpg",
        },
        { authorization: "Bearer valid-token" },
      );

      const response = (await POST(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<AnalysisResult>>;

      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data?.confidence).toBe(0.5);

      // Verify cell state was NOT updated due to low confidence
      expect(AdminPlayerBoardService.updatePlayerBoard).not.toHaveBeenCalled();
    });

    it("should return 401 for missing authorization", async () => {
      const request = createApiRequest(
        `/api/game/${mockGameId}/submission/analyze`,
        "POST",
        {
          submissionId: mockSubmissionId,
          imageUrl: "https://example.com/test-image.jpg",
        },
      );

      const response = (await POST(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<AnalysisResult>>;

      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("MISSING_TOKEN");
    });

    it("should return 404 for non-existent game", async () => {
      const mockDecodedToken = { uid: mockUserId } as DecodedIdToken;
      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

      vi.mocked(AdminGameParticipationService.isParticipant).mockResolvedValue(
        true,
      );
      vi.mocked(AdminGameService.getGame).mockResolvedValue(null);

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission/analyze`,
        "POST",
        {
          submissionId: mockSubmissionId,
          imageUrl: "https://example.com/test-image.jpg",
        },
        { authorization: "Bearer valid-token" },
      );

      const response = (await POST(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<AnalysisResult>>;

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

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission/analyze`,
        "POST",
        {
          submissionId: mockSubmissionId,
          imageUrl: "https://example.com/test-image.jpg",
        },
        { authorization: "Bearer valid-token" },
      );

      const response = (await POST(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<AnalysisResult>>;

      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error?.code).toBe("NOT_PARTICIPANT");
    });

    it("should handle fallback when AI returns subject name instead of cell ID", async () => {
      const mockDecodedToken = { uid: mockUserId } as DecodedIdToken;
      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

      vi.mocked(AdminGameParticipationService.isParticipant).mockResolvedValue(
        true,
      );
      vi.mocked(AdminGameService.getGame).mockResolvedValue(mockGame);
      vi.mocked(AdminGameBoardService.getGameBoard).mockResolvedValue({
        cells: mockCells,
      });
      vi.mocked(AdminPlayerBoardService.getPlayerBoard).mockResolvedValue({
        userId: mockUserId,
        cellStates: {},
        completedLines: [],
      });
      vi.mocked(AdminSubmissionService.getSubmission).mockResolvedValue(
        mockSubmission,
      );
      vi.mocked(AdminSubmissionService.updateSubmission).mockResolvedValue();
      vi.mocked(AdminPlayerBoardService.updatePlayerBoard).mockResolvedValue();

      // Mock Gemini API response with SUBJECT NAME instead of cell ID
      const mockGeminiResponse = {
        matchedCellId: "赤い自転車", // Subject name, not cell ID!
        confidence: 0.85,
        critique_ja: "赤い自転車が写真にはっきりと写っています。",
        critique_en: "A red bicycle is clearly visible in the photo.",
        acceptanceStatus: AcceptanceStatus.ACCEPTED,
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockGeminiResponse),
      });

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(0),
      } as Response);

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission/analyze`,
        "POST",
        {
          submissionId: mockSubmissionId,
          imageUrl: "https://example.com/test-image.jpg",
        },
        { authorization: "Bearer valid-token" },
      );

      const response = (await POST(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<AnalysisResult>>;

      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);

      // The matchedCellId should be converted from subject name to cell ID
      expect(responseData.data?.matchedCellId).toBe("cell-1");
      expect(responseData.data?.confidence).toBe(0.85);
      expect(responseData.data?.acceptanceStatus).toBe(
        AcceptanceStatus.ACCEPTED,
      );

      // Note: State updates are handled by /api/game/[gameId]/submission endpoint
      // This endpoint only performs analysis and returns the resolved cell ID
    });

    it("should set matchedCellId to null when subject name is not found in available cells", async () => {
      const mockDecodedToken = { uid: mockUserId } as DecodedIdToken;
      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

      vi.mocked(AdminGameParticipationService.isParticipant).mockResolvedValue(
        true,
      );
      vi.mocked(AdminGameService.getGame).mockResolvedValue(mockGame);
      vi.mocked(AdminGameBoardService.getGameBoard).mockResolvedValue({
        cells: mockCells,
      });
      vi.mocked(AdminPlayerBoardService.getPlayerBoard).mockResolvedValue({
        userId: mockUserId,
        cellStates: {},
        completedLines: [],
      });
      vi.mocked(AdminSubmissionService.getSubmission).mockResolvedValue(
        mockSubmission,
      );
      vi.mocked(AdminSubmissionService.updateSubmission).mockResolvedValue();

      // Mock Gemini API response with NON-EXISTENT subject name
      const mockGeminiResponse = {
        matchedCellId: "存在しない被写体", // Subject that doesn't exist in available cells
        confidence: 0.85,
        critique_ja: "該当する被写体が見つかりませんでした。",
        critique_en: "The requested subject was not found.",
        acceptanceStatus: AcceptanceStatus.ACCEPTED,
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockGeminiResponse),
      });

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(0),
      } as Response);

      const request = createApiRequest(
        `/api/game/${mockGameId}/submission/analyze`,
        "POST",
        {
          submissionId: mockSubmissionId,
          imageUrl: "https://example.com/test-image.jpg",
        },
        { authorization: "Bearer valid-token" },
      );

      const response = (await POST(request, {
        params: Promise.resolve({ gameId: mockGameId }),
      })) as NextResponse<ApiResponse<AnalysisResult>>;

      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);

      // The matchedCellId should be set to null since subject was not found
      expect(responseData.data?.matchedCellId).toBe(null);

      // Verify cell state was NOT updated
      expect(AdminPlayerBoardService.updatePlayerBoard).not.toHaveBeenCalled();
    });
  });
});
