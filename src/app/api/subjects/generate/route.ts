import type { Locale } from "@/i18n/config";
import { getUserLocale } from "@/services/locale";
import { GoogleGenAI } from "@google/genai";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const generateSubjectsSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  theme: z.string().min(1, { message: "Theme is required" }),
  language: z.enum(["ja", "en"] as const).optional(),
  numberOfCandidates: z.number().int().min(1).max(30).default(25),
});

type GenerateSubjectsRequest = z.infer<typeof generateSubjectsSchema>;

const getPromptTemplate = (params: GenerateSubjectsRequest) => {
  const { title, theme, language, numberOfCandidates } = params;
  console.log("ℹ️ XXX: ~ route.ts ~ getPromptTemplate ~ params:", params);

  return `You are the expert in suggesting specific objects or subjects suitable for a photo bingo game based on the given criteria.
Suggest **${numberOfCandidates}** distinct objects or subjects that can be photographed at the specified title and theme, matching the following conditions.
Focus on concrete nouns or short descriptive phrases that clearly identify the target for a photo.
Google Cloud Vision AI will be used to determine if a photo matches the suggested object/subject, so ensure the suggestions are visually identifiable and relatively unambiguous.
Candidates should be subjects that are not offensive to public order and morals and that are safe for children to see or approach.
If the given title or theme is offensive to public order and morals, return an error with the reason.

Candidates must respond in ${language}.

# Conditions

- Title: ${title}
- Theme: ${theme}

# Output Format

- IMPORTANT: Your response MUST be a raw JSON object WITHOUT any markdown formatting.
- DO NOT use \`\`\`json or \`\`\` markers around your response.
- Strictly output a JSON object with a single key "candidates".
- The value of "candidates" must be a JSON array of strings.
- Each string in the array should be **only the name of the object or subject** (e.g., "White seashells", "wooden bench", "fisherman"), not a full sentence instruction.
- Do not include any other explanations, introductions, or markdown. Output only the pure JSON object.

English response example for Title: Summer Camp, Theme: Campsite by the beach:

{
  "candidates": ["White seashells", "wooden bench", "fisherman", "hibiscus", "turtle", "driftwood", "barbecue grill", "propped up surfboard"]
}

Error response example for immoral title/theme:

{
  "error": "The given theme contains racist expressions."
}`;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = generateSubjectsSchema.safeParse(body);

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
    });

    const text = result.text;
    console.log("ℹ️ XXX: ~ route.ts ~ POST ~ text:", text);

    try {
      if (!text) {
        return NextResponse.json(
          { error: "Empty response from AI" },
          { status: 500 },
        );
      }

      // Clean up the response if it contains markdown code block syntax
      let cleanedText = text;
      if (text.includes("```")) {
        // Remove markdown code block syntax
        cleanedText = text.replace(/```json\s*|\s*```/g, "");
      }

      const jsonResponse = JSON.parse(cleanedText);

      if (jsonResponse.error) {
        return NextResponse.json(
          { error: jsonResponse.error },
          { status: 400 },
        );
      }

      return NextResponse.json(jsonResponse);
    } catch (parseError) {
      console.error("parseError:", parseError);
      // We need to handle parsing errors separately as the AI might not always return valid JSON
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
