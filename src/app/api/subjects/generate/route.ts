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

IMPORTANT: Each subject must meet ALL of the following criteria STRICTLY:
- Be a concrete noun or short descriptive phrase that clearly identifies a photo target (NOT abstract concepts like "happiness", "beauty", "peace")
- Be visually identifiable in a photograph (things you can actually see and photograph)
- Be suitable for recognition by Google Cloud Vision AI (specific objects, not vague descriptions)
- Be unambiguous and specific enough for players to understand what to photograph (avoid "something beautiful", "anything red", etc.)
- Be appropriate for all ages (no offensive content, harmful elements, adult themes, violence, weapons, or illegal activities)
- Be unique within the list (absolutely NO duplicates or very similar items)

CRITICAL: Before finalizing your response, verify that EVERY candidate meets ALL criteria above. Remove any that do not.

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

      // Clean and validate candidates
      if (jsonResponse.candidates && Array.isArray(jsonResponse.candidates)) {
        // Remove control characters and trim
        let candidates = jsonResponse.candidates.map((candidate: string) =>
          candidate.replace(/[\b\n\r\t\f\v]/g, "").trim(),
        );

        // Remove empty strings
        candidates = candidates.filter((c: string) => c.length > 0);

        // Remove duplicates (case-insensitive)
        const seen = new Set<string>();
        candidates = candidates.filter((candidate: string) => {
          const lower = candidate.toLowerCase();
          if (seen.has(lower)) {
            console.warn(
              `Removing duplicate candidate: "${candidate}" (duplicate of existing)`,
            );
            return false;
          }
          seen.add(lower);
          return true;
        });

        jsonResponse.candidates = candidates;

        // Warn if we have fewer candidates than requested
        if (candidates.length < params.numberOfCandidates) {
          console.warn(
            `Generated only ${candidates.length} valid candidates (requested ${params.numberOfCandidates})`,
          );
        }
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
