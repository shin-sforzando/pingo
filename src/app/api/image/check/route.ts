import { adminAuth } from "@/lib/firebase/admin";
import { GoogleGenAI, Type } from "@google/genai";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Request schema
const checkImageSchema = z.object({
  imageUrl: z.string().url("Valid image URL is required"),
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
 * Check if image content is appropriate for public viewing
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
    await adminAuth.verifyIdToken(idToken);

    // Parse request body
    const body = await request.json();
    const validatedData = checkImageSchema.parse(body);
    const { imageUrl } = validatedData;

    // Get the generative model
    const model = genAI.models.generateContent;

    // Prepare the prompt for content checking
    const prompt = `Please check if the given image is safe to show to the general public.

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

    // Prepare the content for Gemini using structured output
    const result = await model({
      model: "gemini-2.0-flash-001",
      contents: [
        prompt,
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

    const text = result.text || "";

    if (!text) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 },
      );
    }

    // Parse the JSON response
    let parsedResponse: { error?: string; ok?: string };
    try {
      // With structured output, we should get clean JSON
      parsedResponse = JSON.parse(text) as { error?: string; ok?: string };
    } catch {
      console.error("Failed to parse Gemini response:", text);
      return NextResponse.json(
        { error: "Invalid response from AI service" },
        { status: 500 },
      );
    }

    // Check if the response indicates inappropriate content
    if (parsedResponse.error) {
      return NextResponse.json(
        {
          appropriate: false,
          reason: parsedResponse.error,
        },
        { status: 200 },
      );
    }

    // Content is appropriate
    return NextResponse.json(
      {
        appropriate: true,
        description: parsedResponse.ok || "Image content is appropriate",
      },
      { status: 200 },
    );
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
