import { adminAuth } from "@/lib/firebase/admin";
import {
  AdminGameBoardService,
  AdminGameService,
  AdminPlayerBoardService,
  AdminTransactionService,
} from "@/lib/firebase/admin-collections";
import { AcceptanceStatus, LineType, ProcessingStatus } from "@/types/common";
import type {
  Cell,
  CompletedLine,
  PlayerBoard,
  Submission,
} from "@/types/schema";
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
 * Helper function to detect completed bingo lines
 */
function detectCompletedLines(
  gameBoard: { cells: Cell[] },
  playerBoard: PlayerBoard,
): CompletedLine[] {
  const completedLines: CompletedLine[] = [];
  const BOARD_SIZE = 5;

  // Create a 5x5 grid mapping for easier line checking
  const grid: boolean[][] = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(false));

  // Fill the grid with open cell states
  for (const cell of gameBoard.cells) {
    const cellState = playerBoard.cellStates[cell.id];
    const isOpen = cell.isFree || cellState?.isOpen || false;
    grid[cell.position.y][cell.position.x] = isOpen;
  }

  // Check rows
  for (let row = 0; row < BOARD_SIZE; row++) {
    if (grid[row].every((cell) => cell)) {
      completedLines.push({
        type: LineType.ROW,
        index: row,
        completedAt: new Date(),
      });
    }
  }

  // Check columns
  for (let col = 0; col < BOARD_SIZE; col++) {
    if (grid.every((row) => row[col])) {
      completedLines.push({
        type: LineType.COLUMN,
        index: col,
        completedAt: new Date(),
      });
    }
  }

  // Check main diagonal (top-left to bottom-right)
  if (grid.every((row, index) => row[index])) {
    completedLines.push({
      type: LineType.DIAGONAL,
      index: 0,
      completedAt: new Date(),
    });
  }

  // Check anti-diagonal (top-right to bottom-left)
  if (grid.every((row, index) => row[BOARD_SIZE - 1 - index])) {
    completedLines.push({
      type: LineType.DIAGONAL,
      index: 1,
      completedAt: new Date(),
    });
  }

  return completedLines;
}

/**
 * Check image content with Gemini AI and create submission record
 * POST /api/image/check
 */
export async function POST(request: NextRequest) {
  try {
    console.log("ℹ️ XXX: ~ image/check/route.ts ~ POST called");

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
    console.log("ℹ️ XXX: ~ image/check/route.ts ~ User authenticated", {
      userId,
    });

    // Parse request body
    const body = await request.json();
    const validatedData = checkImageSchema.parse(body);
    const { gameId, imageUrl, submissionId } = validatedData;
    console.log("ℹ️ XXX: ~ image/check/route.ts ~ Request parsed", {
      gameId,
      submissionId,
      imageUrl,
    });

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

      const transactionResult =
        await AdminTransactionService.createSubmissionOnly(gameId, submission);

      if (!transactionResult.success) {
        console.error("Failed to create submission:", transactionResult.error);
        return NextResponse.json(
          {
            error: "Failed to create submission",
            details: transactionResult.error,
          },
          { status: 500 },
        );
      }

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

      const transactionResult =
        await AdminTransactionService.createSubmissionOnly(gameId, submission);

      if (!transactionResult.success) {
        console.error("Failed to create submission:", transactionResult.error);
        return NextResponse.json(
          {
            error: "Failed to create submission",
            details: transactionResult.error,
          },
          { status: 500 },
        );
      }

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
      game.confidenceThreshold <= analysisResponse.confidence;

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

    // Step 4: Use transaction to atomically create submission and update player board
    if (isAccepted && analysisResponse.matchedCellId) {
      // Update cell state if not already open (double-check to prevent race conditions)
      if (!playerBoard.cellStates[analysisResponse.matchedCellId]?.isOpen) {
        playerBoard.cellStates[analysisResponse.matchedCellId] = {
          isOpen: true,
          openedAt: now,
          openedBySubmissionId: submissionId,
        };

        console.log(
          "ℹ️ XXX: ~ image/check/route.ts ~ Cell opened, detecting lines",
          {
            openedCellId: analysisResponse.matchedCellId,
            previousCompletedLines: playerBoard.completedLines.length,
          },
        );

        // Detect completed bingo lines after opening the cell
        const newCompletedLines = detectCompletedLines(gameBoard, playerBoard);
        console.log(
          "ℹ️ XXX: ~ image/check/route.ts ~ Line detection completed",
          {
            totalDetectedLines: newCompletedLines.length,
            detectedLines: newCompletedLines.map((line) => ({
              type: line.type,
              index: line.index,
            })),
          },
        );

        // Only add newly completed lines (not already in playerBoard.completedLines)
        const existingLineKeys = new Set(
          playerBoard.completedLines.map(
            (line) => `${line.type}-${line.index}`,
          ),
        );

        const freshlyCompletedLines = newCompletedLines.filter(
          (line) => !existingLineKeys.has(`${line.type}-${line.index}`),
        );

        console.log("ℹ️ XXX: ~ image/check/route.ts ~ Newly completed lines", {
          existingLinesCount: playerBoard.completedLines.length,
          freshlyCompletedCount: freshlyCompletedLines.length,
          freshlyCompletedLines: freshlyCompletedLines.map((line) => ({
            type: line.type,
            index: line.index,
          })),
        });

        // Add newly completed lines to player board
        playerBoard.completedLines = [
          ...playerBoard.completedLines,
          ...freshlyCompletedLines,
        ];

        console.log("ℹ️ XXX: ~ image/check/route.ts ~ Updated player board", {
          totalCompletedLines: playerBoard.completedLines.length,
          allCompletedLines: playerBoard.completedLines.map((line) => ({
            type: line.type,
            index: line.index,
          })),
        });

        // Use transaction to ensure atomicity between submission creation and board update
        const transactionResult =
          await AdminTransactionService.createSubmissionAndUpdateBoard(
            gameId,
            submission,
            playerBoard,
            userId,
          );

        if (!transactionResult.success) {
          console.error("Transaction failed:", transactionResult.error);

          // Return error response to client indicating partial failure
          return NextResponse.json(
            {
              error: "Failed to process submission completely",
              details: transactionResult.error,
              appropriate: true,
              confidence: analysisResponse.confidence,
              matchedCellId: analysisResponse.matchedCellId,
              acceptanceStatus: AcceptanceStatus.NO_MATCH, // Downgrade to NO_MATCH due to processing failure
              critique: `Processing failed: ${transactionResult.error}. ${submission.critique}`,
              newlyCompletedLines: 0,
              totalCompletedLines:
                playerBoard.completedLines.length -
                freshlyCompletedLines.length,
              requiredBingoLines: game.requiredBingoLines,
            },
            { status: 500 },
          );
        }

        // Return success response with confetti trigger information
        return NextResponse.json({
          appropriate: true,
          confidence: analysisResponse.confidence,
          matchedCellId: analysisResponse.matchedCellId,
          acceptanceStatus,
          critique: submission.critique,
          newlyCompletedLines: freshlyCompletedLines.length,
          totalCompletedLines: playerBoard.completedLines.length,
          requiredBingoLines: game.requiredBingoLines,
        });
      }
      // Cell is already open, just create submission without board update
      const transactionResult =
        await AdminTransactionService.createSubmissionOnly(gameId, submission);

      if (!transactionResult.success) {
        console.error("Failed to create submission:", transactionResult.error);
        return NextResponse.json(
          {
            error: "Failed to create submission",
            details: transactionResult.error,
          },
          { status: 500 },
        );
      }
    } else {
      // Not accepted or no matched cell, just create submission
      const transactionResult =
        await AdminTransactionService.createSubmissionOnly(gameId, submission);

      if (!transactionResult.success) {
        console.error("Failed to create submission:", transactionResult.error);
        return NextResponse.json(
          {
            error: "Failed to create submission",
            details: transactionResult.error,
          },
          { status: 500 },
        );
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
