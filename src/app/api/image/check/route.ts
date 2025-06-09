import { adminAuth } from "@/lib/firebase/admin";
import {
  AdminGameBoardService,
  AdminGameService,
  AdminPlayerBoardService,
  AdminSubmissionService,
} from "@/lib/firebase/admin-collections";
import { AcceptanceStatus, ProcessingStatus } from "@/types/common";
import type { Submission } from "@/types/schema";
import { GoogleGenAI, Type } from "@google/genai";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Request schema
const checkImageSchema = z.object({
  gameId: z.string(),
  imageUrl: z.string().url("Valid image URL is required"),
  submissionId: z.string(),
});

// Define response schema for structured output
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    error: {
      type: Type.STRING,
    },
    ok: {
      type: Type.STRING,
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
 * Check image content with Gemini AI and create submission record
 * POST /api/image/check
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 },
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Parse request body
    const body = await request.json();
    const validatedData = checkImageSchema.parse(body);
    const { gameId, imageUrl, submissionId } = validatedData;

    // Get game and game board
    const [game, gameBoard] = await Promise.all([
      AdminGameService.getGame(gameId),
      AdminGameBoardService.getGameBoard(gameId),
    ]);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (!gameBoard) {
      return NextResponse.json(
        { error: "Game board not found" },
        { status: 404 },
      );
    }

    // Step 1: Check if image content is appropriate
    const model = genAI.models.generateContent;

    const appropriatenessPrompt = `Please check if the given image is safe to show to the general public.

If the image contains inappropriate content (sexual expressions, violence, harmful elements, adult themes, or anything not suitable for all ages), respond with an error message explaining the reason.

If the image is appropriate, provide a brief description of what the image shows.`;

    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 400 },
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString("base64");

    // Check appropriateness
    const appropriatenessResult = await model({
      model: "gemini-2.0-flash-001",
      contents: [
        appropriatenessPrompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: imageResponse.headers.get("content-type") || "image/jpeg",
          },
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const appropriatenessText = appropriatenessResult.text || "";
    let appropriatenessResponse: { error?: string; ok?: string };

    try {
      appropriatenessResponse = JSON.parse(appropriatenessText) as {
        error?: string;
        ok?: string;
      };
    } catch {
      console.error(
        "Failed to parse Gemini appropriateness response:",
        appropriatenessText,
      );
      return NextResponse.json(
        { error: "Invalid response from AI service" },
        { status: 500 },
      );
    }

    const now = new Date();
    let submission: Submission;

    // If inappropriate content detected
    if (appropriatenessResponse.error) {
      submission = {
        id: submissionId,
        userId,
        imageUrl,
        submittedAt: now,
        analyzedAt: now,
        critique: appropriatenessResponse.error,
        matchedCellId: null,
        confidence: null,
        processingStatus: ProcessingStatus.ANALYZED,
        acceptanceStatus: AcceptanceStatus.INAPPROPRIATE_CONTENT,
        errorMessage: null,
        createdAt: now,
        updatedAt: null,
      };

      await AdminSubmissionService.createSubmission(gameId, submission);

      return NextResponse.json({
        appropriate: false,
        reason: appropriatenessResponse.error,
        confidence: null,
        matchedCellId: null,
        acceptanceStatus: AcceptanceStatus.INAPPROPRIATE_CONTENT,
        critique: appropriatenessResponse.error,
      });
    }

    // Step 2: Get player board to check which cells are still closed
    let playerBoard = await AdminPlayerBoardService.getPlayerBoard(
      gameId,
      userId,
    );

    if (!playerBoard) {
      // Create new player board if it doesn't exist
      playerBoard = {
        userId,
        cellStates: {},
        completedLines: [],
      };
    }

    // Filter cells to only include those that are not yet opened
    const closedCells = gameBoard.cells.filter((cell) => {
      if (cell.isFree) return false; // Skip FREE cells
      const cellState = playerBoard.cellStates[cell.id];
      return !cellState?.isOpen; // Include only cells that are not opened
    });

    // If no closed cells remain, return early
    if (closedCells.length === 0) {
      submission = {
        id: submissionId,
        userId,
        imageUrl,
        submittedAt: now,
        analyzedAt: now,
        critique:
          "All available cells have already been opened. No more matches possible.",
        matchedCellId: null,
        confidence: null,
        processingStatus: ProcessingStatus.ANALYZED,
        acceptanceStatus: AcceptanceStatus.NO_MATCH,
        errorMessage: null,
        createdAt: now,
        updatedAt: null,
      };

      await AdminSubmissionService.createSubmission(gameId, submission);

      return NextResponse.json({
        appropriate: true,
        confidence: null,
        matchedCellId: null,
        acceptanceStatus: AcceptanceStatus.NO_MATCH,
        critique: submission.critique,
      });
    }

    // Step 3: Analyze for bingo cell matches (only closed cells)
    const cellSubjects = closedCells
      .map((cell) => `"${cell.subject}" (ID: ${cell.id})`)
      .join(", ");

    const analysisPrompt = `You are analyzing an image for a bingo game. Here are the available bingo cell subjects:
${cellSubjects}

Please analyze the image and determine:
1. What objects, scenes, or concepts are visible in the image
2. Which bingo cell subject (if any) best matches what you see
3. Your confidence level (0.0 to 1.0) in the match

Respond with a JSON object containing:
- "description": A detailed description of what you see in the image
- "matchedCellId": The ID of the matching cell (or null if no good match)
- "confidence": Your confidence level (0.0 to 1.0)
- "reasoning": Explanation of why you chose this match or why no match was found

Be strict in your matching - only match if you're confident the image clearly shows the subject.`;

    const analysisResult = await model({
      model: "gemini-2.0-flash-001",
      contents: [
        analysisPrompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: imageResponse.headers.get("content-type") || "image/jpeg",
          },
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const analysisText = analysisResult.text || "";
    let analysisResponse: {
      description: string;
      matchedCellId: string | null;
      confidence: number;
      reasoning: string;
    };

    try {
      analysisResponse = JSON.parse(analysisText);
    } catch {
      console.error("Failed to parse Gemini analysis response:", analysisText);
      return NextResponse.json(
        { error: "Invalid analysis response from AI service" },
        { status: 500 },
      );
    }

    // Determine acceptance status based on confidence threshold
    const isAccepted =
      analysisResponse.matchedCellId &&
      analysisResponse.confidence >= game.confidenceThreshold;

    const acceptanceStatus = isAccepted
      ? AcceptanceStatus.ACCEPTED
      : AcceptanceStatus.NO_MATCH;

    // Create submission record
    submission = {
      id: submissionId,
      userId,
      imageUrl,
      submittedAt: now,
      analyzedAt: now,
      critique: `${analysisResponse.description}\n\n${analysisResponse.reasoning}`,
      matchedCellId: analysisResponse.matchedCellId,
      confidence: analysisResponse.confidence,
      processingStatus: ProcessingStatus.ANALYZED,
      acceptanceStatus,
      errorMessage: null,
      createdAt: now,
      updatedAt: null,
    };

    await AdminSubmissionService.createSubmission(gameId, submission);

    // Step 4: If accepted, update player board
    if (isAccepted && analysisResponse.matchedCellId) {
      try {
        // Update cell state if not already open (double-check to prevent race conditions)
        if (!playerBoard.cellStates[analysisResponse.matchedCellId]?.isOpen) {
          playerBoard.cellStates[analysisResponse.matchedCellId] = {
            isOpen: true,
            openedAt: now,
            openedBySubmissionId: submissionId,
          };

          // Check for completed lines (simplified - you may want to implement full bingo logic)
          // For now, just save the updated board
          await AdminPlayerBoardService.updatePlayerBoard(
            gameId,
            userId,
            playerBoard,
          );
        }
      } catch (error) {
        console.error("Failed to update player board:", error);
        // Don't fail the entire request if board update fails
      }
    }

    return NextResponse.json({
      appropriate: true,
      confidence: analysisResponse.confidence,
      matchedCellId: analysisResponse.matchedCellId,
      acceptanceStatus,
      critique: submission.critique,
    });
  } catch (error) {
    console.error("Error checking image content:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message.includes("auth")) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
