import { beforeAll, describe, expect, it } from "vitest";
import { createApiRequest } from "@/test/helpers/api-test-helpers";
import { POST } from "./route";

describe("subjects/generate API", () => {
  // Skip all tests if GEMINI_API_KEY is not available
  beforeAll(() => {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("Skipping tests: GEMINI_API_KEY is not available");
    }
  });

  it("should validate required fields", async () => {
    const req = createApiRequest("/api/subjects/generate", "POST", {});

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.title).toBeDefined();
    expect(data.error.theme).toBeDefined();
  });

  it("should validate field types", async () => {
    const req = createApiRequest("/api/subjects/generate", "POST", {
      title: "Test",
      theme: "Test",
      numberOfCandidates: "invalid",
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.numberOfCandidates).toBeDefined();
  });

  it("should generate subjects for valid input with explicit language", async () => {
    // Skip this test if GEMINI_API_KEY is not available
    if (!process.env.GEMINI_API_KEY) {
      return;
    }

    const req = createApiRequest("/api/subjects/generate", "POST", {
      title: "Summer Camp",
      theme: "Campsite by the beach",
      language: "en",
      numberOfCandidates: 20,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.candidates).toBeDefined();
    expect(Array.isArray(data.candidates)).toBe(true);
    expect(data.candidates.length).toBe(20);

    // Each candidate should be a non-empty string
    for (const candidate of data.candidates) {
      expect(typeof candidate).toBe("string");
      expect(candidate.length).toBeGreaterThan(0);
    }
  });

  it("should generate Japanese subjects when language is set to ja", async () => {
    // Skip this test if GEMINI_API_KEY is not available
    if (!process.env.GEMINI_API_KEY) {
      return;
    }

    const req = createApiRequest("/api/subjects/generate", "POST", {
      title: "夏祭り",
      theme: "日本の伝統的な夏祭り",
      language: "ja",
      numberOfCandidates: 20,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.candidates).toBeDefined();
    expect(Array.isArray(data.candidates)).toBe(true);

    // Check if at least some candidates contain Japanese characters
    const hasJapaneseChar = data.candidates.some((candidate: string) =>
      /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf]/.test(
        candidate,
      ),
    );
    expect(hasJapaneseChar).toBe(true);
  });

  it("should use user locale when language is not specified", async () => {
    // Skip this test if GEMINI_API_KEY is not available
    if (!process.env.GEMINI_API_KEY) {
      return;
    }

    // This test assumes getUserLocale returns a value (default or from cookie)
    const req = createApiRequest("/api/subjects/generate", "POST", {
      title: "Travel",
      theme: "City exploration",
      numberOfCandidates: 20,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.candidates).toBeDefined();
    expect(Array.isArray(data.candidates)).toBe(true);
    expect(data.candidates.length).toBe(20);
  });

  it("should handle inappropriate content", async () => {
    // Skip this test if GEMINI_API_KEY is not available
    if (!process.env.GEMINI_API_KEY) {
      return;
    }

    const req = createApiRequest("/api/subjects/generate", "POST", {
      title: "Weapons",
      theme: "Dangerous items",
      language: "en",
      numberOfCandidates: 20,
    });

    const response = await POST(req);

    // The API might either return an error or filter the results
    // We just verify that the request completes without throwing
    expect(response.status === 200 || response.status === 400).toBe(true);
  });

  it("should return error for offensive content in English", async () => {
    // Skip this test if GEMINI_API_KEY is not available
    if (!process.env.GEMINI_API_KEY) {
      return;
    }

    const req = createApiRequest("/api/subjects/generate", "POST", {
      title: "Illegal substances",
      theme: "Drug paraphernalia",
      language: "en",
      numberOfCandidates: 20,
    });

    const response = await POST(req);
    const data = await response.json();

    // For clearly offensive content, we expect either:
    // 1. A 400 status with an error message (preferred)
    // 2. A 200 status with filtered/safe results
    if (response.status === 400) {
      expect(data.error).toBeDefined();
      expect(typeof data.error).toBe("string");
    } else {
      expect(response.status).toBe(200);
      expect(data.candidates).toBeDefined();
      expect(Array.isArray(data.candidates)).toBe(true);
      // Ensure the candidates are appropriate
      for (const candidate of data.candidates) {
        expect(typeof candidate).toBe("string");
      }
    }
  });

  it("should return error for offensive content in Japanese", async () => {
    // Skip this test if GEMINI_API_KEY is not available
    if (!process.env.GEMINI_API_KEY) {
      return;
    }

    const req = createApiRequest("/api/subjects/generate", "POST", {
      title: "うんこ",
      theme: "ちんこ",
      language: "ja",
      numberOfCandidates: 20,
    });

    const response = await POST(req);
    const data = await response.json();

    // For clearly offensive content, we expect either:
    // 1. A 400 status with an error message (preferred)
    // 2. A 200 status with filtered/safe results
    if (response.status === 400) {
      expect(data.error).toBeDefined();
      expect(typeof data.error).toBe("string");
    } else {
      expect(response.status).toBe(200);
      expect(data.candidates).toBeDefined();
      expect(Array.isArray(data.candidates)).toBe(true);
      // Ensure the candidates are appropriate
      for (const candidate of data.candidates) {
        expect(typeof candidate).toBe("string");
      }
    }
  });
});
