import { GoogleGenAI, Type } from "@google/genai";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveCellId } from "@/lib/cell-utils";
import { GEMINI_MODEL, GEMINI_THINKING_BUDGET } from "@/lib/constants";
import { adminAuth } from "@/lib/firebase/admin";
import {
  AdminGameBoardService,
  AdminGameParticipationService,
  AdminGameService,
  AdminPlayerBoardService,
  AdminSubmissionService,
} from "@/lib/firebase/admin-collections";
import type { ApiResponse } from "@/types/common";
import { AcceptanceStatus, ProcessingStatus } from "@/types/common";
import type { AnalysisResult, Cell } from "@/types/schema";
import { analysisResultSchema } from "@/types/schema";

// Request body schema
const analyzeRequestSchema = z.object({
  submissionId: z.ulid(),
  imageUrl: z.url(),
});

// Gemini response schema for structured output
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    matchedCellId: {
      type: Type.STRING,
      description: "ID of the matched cell, null if no match",
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence score between 0.0 and 1.0",
    },
    critique_ja: {
      type: Type.STRING,
      description:
        "Comprehensive analysis in Japanese (minimum 3-4 sentences): specific objects/scenes, visual characteristics, relation to bingo cells, thorough match/no-match explanation",
    },
    critique_en: {
      type: Type.STRING,
      description:
        "Comprehensive analysis in English (minimum 3-4 sentences): specific objects/scenes, visual characteristics, relation to bingo cells, thorough match/no-match explanation",
    },
    acceptanceStatus: {
      type: Type.STRING,
      description: "Final acceptance status",
    },
  },
};

// Initialize Gemini AI
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Authenticate user and return user ID
 */
async function authenticateUser(
  request: NextRequest,
): Promise<string | NextResponse<ApiResponse<never>>> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_TOKEN",
          message: "Missing authentication token",
        },
      },
      { status: 401 },
    );
  }

  try {
    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (_error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid authentication token",
        },
      },
      { status: 401 },
    );
  }
}

/**
 * Verify user is a game participant
 */
async function verifyGameParticipant(
  gameId: string,
  userId: string,
): Promise<NextResponse<ApiResponse<never>> | null> {
  const isParticipant = await AdminGameParticipationService.isParticipant(
    gameId,
    userId,
  );

  if (!isParticipant) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NOT_PARTICIPANT",
          message: "User is not a participant in this game",
        },
      },
      { status: 403 },
    );
  }

  return null;
}

/**
 * Get available cells (not yet opened) for the user
 */
async function getAvailableCells(
  gameId: string,
  userId: string,
): Promise<Cell[]> {
  // Get game board
  const gameBoard = await AdminGameBoardService.getGameBoard(gameId);
  if (!gameBoard) {
    throw new Error("Game board not found");
  }

  // Get player board to check which cells are already open
  const playerBoard = await AdminPlayerBoardService.getPlayerBoard(
    gameId,
    userId,
  );

  if (!playerBoard) {
    // If no player board exists, all cells are available except FREE cells
    return gameBoard.cells.filter((cell: Cell) => !cell.isFree);
  }

  // Filter out already opened cells and FREE cells
  return gameBoard.cells.filter((cell: Cell) => {
    if (cell.isFree) return false;
    const cellState = playerBoard.cellStates[cell.id];
    return !cellState?.isOpen;
  });
}

/**
 * Generate analysis prompt for Gemini
 */
function getAnalysisPrompt(availableCells: Cell[], gameTheme: string): string {
  return `You are an expert image analyzer for a photo bingo game.

Analyze the provided image and determine if it matches any of the available bingo cells.

Game Theme: ${gameTheme}

Available Cells (not yet opened):
${availableCells
  .map(
    (cell, index) => `${index + 1}. ID: ${cell.id}, Subject: "${cell.subject}"`,
  )
  .join("\n")}

Analysis Criteria:
1. The image must clearly show the subject described in one of the available cells
2. The subject must be the main focus or clearly visible in the image
3. The image must be appropriate for all ages (no offensive content)
4. Confidence threshold will be applied by the system (you provide raw confidence)

Provide:
- matchedCellId: The ID of the best matching cell (null if no good match)
- confidence: Confidence score from 0.0 to 1.0 (be conservative but fair)
- critique_ja: Comprehensive explanation in Japanese (minimum 3-4 sentences). Describe in detail: what specific objects/scenes you see in the image, their visual characteristics and context, how they relate to each available bingo cell subject, and a thorough explanation of why they match or don't match. (日本語で最低3-4文の包括的な説明。画像内の具体的な物体・シーン、その視覚的特徴と文脈、各利用可能なビンゴセルの被写体との関連性、そしてマッチする/しない理由を詳しく説明してください。)
- critique_en: Comprehensive explanation in English (minimum 3-4 sentences). Describe in detail: what specific objects/scenes you see in the image, their visual characteristics and context, how they relate to each available bingo cell subject, and a thorough explanation of why they match or don't match.
- acceptanceStatus: "accepted" (good match), "no_match" (no suitable match), or "inappropriate_content" (inappropriate image)

Be thorough in your analysis but conservative in matching. Only match if you're reasonably confident the image shows the requested subject.`;
}

/**
 * Fetch image as base64 for Gemini API
 */
async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return base64;
}

/**
 * Update cell state to OPEN
 */
async function updateCellState(
  gameId: string,
  userId: string,
  cellId: string,
  submissionId: string,
): Promise<void> {
  const playerBoard = await AdminPlayerBoardService.getPlayerBoard(
    gameId,
    userId,
  );

  if (!playerBoard) {
    throw new Error("Player board not found");
  }

  // Update cell state
  const updatedCellStates = {
    ...playerBoard.cellStates,
    [cellId]: {
      isOpen: true,
      openedAt: new Date(),
      openedBySubmissionId: submissionId,
    },
  };

  const updatedPlayerBoard = {
    ...playerBoard,
    cellStates: updatedCellStates,
  };

  await AdminPlayerBoardService.updatePlayerBoard(
    gameId,
    userId,
    updatedPlayerBoard,
  );
}

/**
 * Update submission with analysis results
 */
async function updateSubmissionAnalysis(
  gameId: string,
  submissionId: string,
  analysis: AnalysisResult,
): Promise<void> {
  const submission = await AdminSubmissionService.getSubmission(
    gameId,
    submissionId,
  );

  if (!submission) {
    throw new Error("Submission not found");
  }

  const updatedSubmission = {
    ...submission,
    analyzedAt: new Date(),
    critique_ja: analysis.critique_ja,
    critique_en: analysis.critique_en,
    matchedCellId: analysis.matchedCellId,
    confidence: analysis.confidence,
    processingStatus: ProcessingStatus.ANALYZED,
    acceptanceStatus: analysis.acceptanceStatus,
  };

  await AdminSubmissionService.updateSubmission(
    gameId,
    submissionId,
    updatedSubmission,
  );
}

/**
 * POST /api/game/[gameId]/submission/analyze
 * Analyze uploaded image and determine if it matches any available cells
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
): Promise<NextResponse<ApiResponse<AnalysisResult>>> {
  try {
    const { gameId } = await params;
    console.log("ℹ️ XXX: ~ analyze/route.ts ~ POST called", { gameId });

    // Authenticate user
    const authResult = await authenticateUser(request);
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult;
    console.log("ℹ️ XXX: ~ analyze/route.ts ~ User authenticated", { userId });

    // Parse request body
    const body = await request.json();
    const { submissionId, imageUrl } = analyzeRequestSchema.parse(body);
    console.log("ℹ️ XXX: ~ analyze/route.ts ~ Request parsed", {
      submissionId,
      imageUrl,
    });

    // Verify user is game participant
    const participantCheck = await verifyGameParticipant(gameId, userId);
    if (participantCheck) return participantCheck;

    // Get game information
    const game = await AdminGameService.getGame(gameId);
    if (!game) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "GAME_NOT_FOUND",
            message: "Game not found",
          },
        },
        { status: 404 },
      );
    }

    // Get available cells for analysis
    const availableCells = await getAvailableCells(gameId, userId);
    console.log("ℹ️ XXX: ~ analyze/route.ts ~ Available cells", {
      count: availableCells.length,
      cells: availableCells.map((cell) => ({
        id: cell.id,
        subject: cell.subject,
      })),
    });

    if (availableCells.length === 0) {
      console.log(
        "ℹ️ XXX: ~ analyze/route.ts ~ No available cells - all opened",
      );
      // No cells available - all are already open
      const analysis: AnalysisResult = {
        matchedCellId: null,
        confidence: 0,
        critique_ja: "すべてのセルが開かれています。分析は不要です。",
        critique_en: "All cells are already opened. No analysis needed.",
        acceptanceStatus: AcceptanceStatus.NO_MATCH,
      };

      await updateSubmissionAnalysis(gameId, submissionId, analysis);

      return NextResponse.json({
        success: true,
        data: analysis,
      });
    }

    // Get the generative model
    const model = genAI.models.generateContent;

    // Generate analysis prompt
    const prompt = getAnalysisPrompt(availableCells, game.theme);

    // Fetch image as base64
    const imageBase64 = await fetchImageAsBase64(imageUrl);

    // Analyze image with Gemini using structured output
    const result = await model({
      model: GEMINI_MODEL,
      contents: [
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: "image/jpeg",
          },
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema,
        thinkingConfig: {
          thinkingBudget: GEMINI_THINKING_BUDGET,
        },
      },
    });

    const text = result.text || "";

    if (!text) {
      throw new Error("Empty response from AI");
    }

    // Parse structured response
    const analysisData = JSON.parse(text);

    // Validate response with Zod
    const parsedAnalysis = analysisResultSchema.parse(analysisData);

    // Resolve matchedCellId (fallback if AI returned subject name instead of cell ID)
    const resolvedCellId = resolveCellId(
      parsedAnalysis.matchedCellId,
      availableCells,
    );

    const analysis = {
      ...parsedAnalysis,
      matchedCellId: resolvedCellId,
    };

    console.log("ℹ️ XXX: ~ analyze/route.ts ~ Analysis completed", {
      analysis,
      confidenceThreshold: game.confidenceThreshold,
      meetsThreshold: game.confidenceThreshold <= analysis.confidence,
    });

    // Check confidence threshold and update cell state if accepted
    if (
      analysis.matchedCellId &&
      game.confidenceThreshold <= analysis.confidence &&
      analysis.acceptanceStatus === AcceptanceStatus.ACCEPTED
    ) {
      console.log("ℹ️ XXX: ~ analyze/route.ts ~ Updating cell state", {
        cellId: analysis.matchedCellId,
        confidence: analysis.confidence,
        threshold: game.confidenceThreshold,
      });
      await updateCellState(
        gameId,
        userId,
        analysis.matchedCellId,
        submissionId,
      );
      console.log(
        "ℹ️ XXX: ~ analyze/route.ts ~ Cell state updated successfully",
      );
    } else {
      console.log("ℹ️ XXX: ~ analyze/route.ts ~ Cell state not updated", {
        reason: !analysis.matchedCellId
          ? "no match"
          : analysis.confidence < game.confidenceThreshold
            ? "low confidence"
            : "not accepted",
        matchedCellId: analysis.matchedCellId,
        confidence: analysis.confidence,
        threshold: game.confidenceThreshold,
        acceptanceStatus: analysis.acceptanceStatus,
      });
    }

    // Update submission with analysis results
    await updateSubmissionAnalysis(gameId, submissionId, analysis);
    console.log(
      "ℹ️ XXX: ~ analyze/route.ts ~ Submission updated with analysis results",
    );

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("Failed to analyze image:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ANALYSIS_FAILED",
          message: "Failed to analyze image",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 },
    );
  }
}
