import { GoogleGenAI, Type } from "@google/genai";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Locale } from "@/i18n/config";
import { GEMINI_MODEL, GEMINI_THINKING_BUDGET } from "@/lib/constants";
import { getUserLocale } from "@/services/locale";

const generateSubjectsSchema = z.object({
  title: z.string().min(1, {
    error: "Title is required",
  }),
  theme: z.string().min(1, {
    error: "Theme is required",
  }),
  language: z.enum(["ja", "en"] as const).optional(),
  numberOfCandidates: z.int().min(1).max(30).default(25),
});

type GenerateSubjectsRequest = z.infer<typeof generateSubjectsSchema>;

// Define response schema for structured output
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    candidates: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
    },
    error: {
      type: Type.STRING,
    },
  },
};

const getPromptTemplate = (params: GenerateSubjectsRequest) => {
  const { title, theme, language, numberOfCandidates } = params;
  console.log("ℹ️ XXX: ~ route.ts ~ getPromptTemplate ~ params:", params);

  return `You are an expert in suggesting specific objects or subjects suitable for a photo bingo game based on the given criteria.
Suggest **${numberOfCandidates}** distinct objects or subjects that can be photographed at the specified title and theme.

Focus on concrete nouns or short descriptive phrases that clearly identify the target for a photo.
Google Cloud Vision AI will be used to determine if a photo matches the suggested object/subject, so ensure the suggestions are visually identifiable and relatively unambiguous.

Each subject must meet ALL of the following criteria:
- Be a concrete noun or short descriptive phrase that clearly identifies a photo target
- Be visually identifiable in a photograph
- Be suitable for recognition by Google Cloud Vision AI
- Be unambiguous and specific enough for players to understand what to photograph
- Be appropriate for all ages (no offensive content, harmful elements, adult themes, violence, or illegal activities)
- Be unique within the list (not duplicated or too similar to other subjects)

Candidates must be in ${language}.

If the given title or theme is offensive to public order and morals, respond with an error message explaining the reason.

# Conditions

- Title: ${title}
- Theme: ${theme}`;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = generateSubjectsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues },
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
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema,
        thinkingConfig: {
          thinkingBudget: GEMINI_THINKING_BUDGET,
        },
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
      const jsonResponse = JSON.parse(text);

      if (jsonResponse.error) {
        return NextResponse.json(
          { error: jsonResponse.error },
          { status: 400 },
        );
      }

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
    console.error("Error generating subjects:", error);
    return NextResponse.json(
      { error: "Failed to generate subjects" },
      { status: 500 },
    );
  }
}
