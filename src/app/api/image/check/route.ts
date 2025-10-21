import { GoogleGenAI, Type } from "@google/genai";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GEMINI_MODEL, GEMINI_THINKING_BUDGET } from "@/lib/constants";
import { adminAuth } from "@/lib/firebase/admin";
import { AdminGameService } from "@/lib/firebase/admin-collections";
import type { ApiResponse } from "@/types/common";

// Request body schema
const checkImageRequestSchema = z.object({
  gameId: z.string().regex(/^[A-Z0-9]{6}$/, "Valid game ID is required"),
  imageUrl: z.string().url("Valid image URL is required"),
});

// Gemini response schema for appropriateness check
const appropriatenessResponseSchema = {
  type: Type.OBJECT,
  properties: {
    ok: {
      type: Type.STRING,
      nullable: true,
      description: "OK message if image is appropriate",
    },
    error: {
      type: Type.STRING,
      nullable: true,
      description: "Error message if image is inappropriate",
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
 * POST /api/image/check
 * Check if an image is appropriate for all ages
 *
 * Single Responsibility: Image appropriateness validation only
 */
export async function POST(
  request: NextRequest,
): Promise<
  NextResponse<ApiResponse<{ appropriate: boolean; reason?: string }>>
> {
  try {
    console.log("ℹ️ XXX: ~ image/check/route.ts ~ POST called");

    // Authenticate user
    const authResult = await authenticateUser(request);
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult;
    console.log("ℹ️ XXX: ~ image/check/route.ts ~ User authenticated", {
      userId,
    });

    // Parse request body
    const body = await request.json();
    const { gameId, imageUrl } = checkImageRequestSchema.parse(body);
    console.log("ℹ️ XXX: ~ image/check/route.ts ~ Request parsed", {
      gameId,
      imageUrl,
    });

    // Get game settings to check if image check should be skipped
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

    // Skip check if game setting allows it
    if (game.skipImageCheck) {
      console.log(
        "ℹ️ XXX: ~ image/check/route.ts ~ Skipping check due to game settings",
      );
      return NextResponse.json({
        success: true,
        data: {
          appropriate: true,
          reason: "Check skipped per game settings",
        },
      });
    }

    // Fetch image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "IMAGE_FETCH_FAILED",
            message: "Failed to fetch image from URL",
          },
        },
        { status: 400 },
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString("base64");

    // Check appropriateness with Gemini
    const model = genAI.models.generateContent;

    const appropriatenessPrompt = `Please check if the given image is safe to show to the general public.

If the image contains inappropriate content (sexual expressions, violence, harmful elements, adult themes, or anything not suitable for all ages), respond with an error message explaining the reason.

Otherwise, respond with an ok message.

Respond as JSON with either:
- {"ok": "Image is appropriate"} if the image is safe
- {"error": "Reason why the image is inappropriate"} if the image is not safe`;

    console.log(
      "ℹ️ XXX: ~ image/check/route.ts ~ Calling Gemini for appropriateness check",
    );

    const appropriatenessResult = await model({
      model: GEMINI_MODEL,
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
        responseSchema: appropriatenessResponseSchema,
        thinkingConfig: {
          thinkingBudget: GEMINI_THINKING_BUDGET,
        },
      },
    });

    const appropriatenessText = appropriatenessResult.text || "";
    let appropriatenessResponse: { error?: string; ok?: string };

    try {
      appropriatenessResponse = JSON.parse(appropriatenessText);
      console.log(
        "ℹ️ XXX: ~ image/check/route.ts ~ Gemini appropriateness response",
        {
          appropriatenessResponse,
        },
      );
    } catch {
      console.error(
        "Failed to parse Gemini appropriateness response:",
        appropriatenessText,
      );
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_RESPONSE",
            message: "Invalid response from AI service",
          },
        },
        { status: 500 },
      );
    }

    // Determine if image is appropriate
    const appropriate = !appropriatenessResponse.error;
    const reason = appropriatenessResponse.error || appropriatenessResponse.ok;

    console.log(
      "ℹ️ XXX: ~ image/check/route.ts ~ Appropriateness check result",
      {
        appropriate,
        reason,
      },
    );

    return NextResponse.json({
      success: true,
      data: {
        appropriate,
        reason,
      },
    });
  } catch (error) {
    console.error("Error checking image content:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: error.issues,
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to check image content",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 },
    );
  }
}
