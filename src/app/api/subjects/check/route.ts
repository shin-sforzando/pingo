import type { Locale } from "@/i18n/config";
import { getUserLocale } from "@/services/locale";
import { GoogleGenAI, Type } from "@google/genai";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const checkSubjectsSchema = z.object({
  subjects: z
    .array(z.string())
    .min(1, { message: "At least one subject is required" }),
  language: z.enum(["ja", "en"] as const).optional(),
});

type CheckSubjectsRequest = z.infer<typeof checkSubjectsSchema>;

interface CheckIssue {
  subject: string;
  reason: string;
}

interface CheckResponse {
  ok: boolean;
  issues?: CheckIssue[];
}

// Define response schema for structured output
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    ok: {
      type: Type.BOOLEAN,
    },
    issues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          subject: {
            type: Type.STRING,
          },
          reason: {
            type: Type.STRING,
          },
        },
        required: ["subject", "reason"],
      },
    },
  },
  required: ["ok"],
};

const getPromptTemplate = (params: CheckSubjectsRequest) => {
  const { subjects, language } = params;
  console.log("ℹ️ XXX: ~ route.ts ~ getPromptTemplate ~ params:", params);

  return `You are a content moderator for a family-friendly photo bingo game.
Please check if the following subjects are appropriate for the game.

Each subject must meet ALL of the following criteria:
- Be a concrete noun or short descriptive phrase that clearly identifies a photo target
- Be visually identifiable in a photograph
- Be suitable for recognition by Google Cloud Vision AI
- Be unambiguous and specific enough for players to understand what to photograph
- Be appropriate for all ages (no offensive content, harmful elements, adult themes, violence, or illegal activities)
- Be unique within the list (not duplicated or too similar to other subjects)

Subjects to check:
${subjects.map((subject) => `- "${subject}"`).join("\n")}

If all subjects are appropriate, respond with ok: true.
If there are issues, provide a list of issues with the subject and reason in ${language || "ja"}.
Ensure reasons clearly explain which criteria were not met.`;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = checkSubjectsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.format() },
        { status: 400 },
      );
    }

    // Get user locale if language is not specified in the request
    let userLocale: Locale = "ja"; // Default to Japanese
    try {
      userLocale = (await getUserLocale()) as Locale;
    } catch (_error) {
      // If getUserLocale fails, use default Japanese
      console.warn("Failed to get user locale, using default Japanese");
    }

    const params = {
      ...validationResult.data,
      language: validationResult.data.language || userLocale,
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 },
      );
    }

    const genAI = new GoogleGenAI({ apiKey });

    const prompt = getPromptTemplate(params);
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const text = result.text;
    console.log("ℹ️ XXX: ~ route.ts ~ POST ~ AI Response:", text);

    if (!text) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 },
      );
    }

    try {
      // With structured output, we should get clean JSON without markdown
      const parsedResponse = JSON.parse(text);

      // Normalize the response to match our expected format
      const jsonResponse: CheckResponse = parsedResponse.issues
        ? { ok: false, issues: parsedResponse.issues }
        : { ok: true };

      // Always return with 200 status since we're explicitly checking for issues
      return NextResponse.json(jsonResponse);
    } catch (parseError) {
      console.error("parseError:", parseError);
      // This should be rare with structured output, but keep as fallback
      return NextResponse.json(
        { error: "Failed to parse AI response", rawResponse: text },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error checking subjects:", error);
    return NextResponse.json(
      { error: "Failed to check subjects" },
      { status: 500 },
    );
  }
}
