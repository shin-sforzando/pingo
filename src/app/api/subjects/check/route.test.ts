import { beforeAll, describe, expect, it } from "vitest";
import { createApiRequest } from "@/test/helpers/api-test-helpers";
import { POST as generatePOST } from "../generate/route";
import { POST } from "./route";

interface CheckIssue {
  subject: string;
  reason: string;
}

describe("subjects/check API", () => {
  // Skip all tests if GEMINI_API_KEY is not available
  beforeAll(() => {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("Skipping tests: GEMINI_API_KEY is not available");
    }
  });

  it("should validate required fields", async () => {
    const req = createApiRequest("/api/subjects/check", "POST", {});

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(Array.isArray(data.error)).toBe(true);
  });

  it("should validate subjects array is not empty", async () => {
    const req = createApiRequest("/api/subjects/check", "POST", {
      subjects: [],
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(Array.isArray(data.error)).toBe(true);
  });

  it("should validate field types", async () => {
    const req = createApiRequest("/api/subjects/check", "POST", {
      subjects: "not an array",
      language: "invalid",
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(Array.isArray(data.error)).toBe(true);
    expect(data.error.length).toBeGreaterThan(0);
  });

  it("should approve appropriate subjects in English", async () => {
    // Skip this test if GEMINI_API_KEY is not available
    if (!process.env.GEMINI_API_KEY) {
      return;
    }

    const req = createApiRequest("/api/subjects/check", "POST", {
      subjects: [
        "Red bicycle",
        "Blue mailbox",
        "Yellow fire hydrant",
        "Green park bench",
        "White church steeple",
      ],
      language: "en",
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.issues).toBeUndefined();
  });

  it("should approve appropriate subjects in Japanese", async () => {
    // Skip this test if GEMINI_API_KEY is not available
    if (!process.env.GEMINI_API_KEY) {
      return;
    }

    const req = createApiRequest("/api/subjects/check", "POST", {
      subjects: [
        "赤い自転車",
        "青いポスト",
        "黄色い消火栓",
        "緑の公園のベンチ",
        "白い教会の尖塔",
      ],
      language: "ja",
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.issues).toBeUndefined();
  });

  it("should detect abstract concepts that cannot be photographed in English", async () => {
    // Skip this test if GEMINI_API_KEY is not available
    if (!process.env.GEMINI_API_KEY) {
      return;
    }

    const req = createApiRequest("/api/subjects/check", "POST", {
      subjects: [
        "Red bicycle",
        "Happiness",
        "Love",
        "Green park bench",
        "Freedom",
      ],
      language: "en",
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(false);
    expect(data.issues).toBeDefined();
    expect(Array.isArray(data.issues)).toBe(true);

    // Check if abstract concepts are detected
    // Note: Gemini API might not detect all abstract concepts consistently
    // So we check if at least some of the expected abstract concepts are detected
    const abstractConcepts = ["Happiness", "Love", "Freedom"];
    let detectedCount = 0;
    for (const concept of abstractConcepts) {
      if (data.issues.some((issue: CheckIssue) => issue.subject === concept)) {
        detectedCount++;
      }
    }
    // At least 2 of the 3 abstract concepts should be detected
    expect(detectedCount).toBeGreaterThanOrEqual(2);
  });

  it("should detect vague or ambiguous descriptions in English", async () => {
    // Skip this test if GEMINI_API_KEY is not available
    if (!process.env.GEMINI_API_KEY) {
      return;
    }

    const req = createApiRequest("/api/subjects/check", "POST", {
      subjects: [
        "Red bicycle",
        "Something beautiful",
        "Nice view",
        "Green park bench",
        "Interesting object",
      ],
      language: "en",
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(false);
    expect(data.issues).toBeDefined();
    expect(Array.isArray(data.issues)).toBe(true);

    // Check if vague descriptions are detected
    const vagueDescriptions = [
      "Something beautiful",
      "Nice view",
      "Interesting object",
    ];
    for (const description of vagueDescriptions) {
      expect(
        data.issues.some((issue: CheckIssue) => issue.subject === description),
      ).toBe(true);
    }
  });

  it("should detect inappropriate content in English", async () => {
    // Skip this test if GEMINI_API_KEY is not available
    if (!process.env.GEMINI_API_KEY) {
      return;
    }

    const req = createApiRequest("/api/subjects/check", "POST", {
      subjects: [
        "Red bicycle",
        "Gun",
        "Cigarette",
        "Green park bench",
        "Alcoholic drink",
      ],
      language: "en",
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(false);
    expect(data.issues).toBeDefined();
    expect(Array.isArray(data.issues)).toBe(true);

    // Check if inappropriate content is detected
    const inappropriateContent = ["Gun", "Cigarette", "Alcoholic drink"];
    for (const content of inappropriateContent) {
      expect(
        data.issues.some((issue: CheckIssue) => issue.subject === content),
      ).toBe(true);
    }
  });

  it("should detect duplicate or similar items in English", async () => {
    // Skip this test if GEMINI_API_KEY is not available
    if (!process.env.GEMINI_API_KEY) {
      return;
    }

    const req = createApiRequest("/api/subjects/check", "POST", {
      subjects: [
        "Red bicycle",
        "Red bike",
        "Green park bench",
        "Park bench",
        "White church steeple",
      ],
      language: "en",
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(false);
    expect(data.issues).toBeDefined();
    expect(Array.isArray(data.issues)).toBe(true);

    // At least one of the duplicates should be detected
    const duplicates = [
      ["Red bicycle", "Red bike"],
      ["Green park bench", "Park bench"],
    ];

    for (const [item1, item2] of duplicates) {
      expect(
        data.issues.some(
          (issue: CheckIssue) =>
            issue.subject === item1 || issue.subject === item2,
        ),
      ).toBe(true);
    }
  });

  it("should detect abstract concepts that cannot be photographed in Japanese", async () => {
    // Skip this test if GEMINI_API_KEY is not available
    if (!process.env.GEMINI_API_KEY) {
      return;
    }

    const req = createApiRequest("/api/subjects/check", "POST", {
      subjects: ["赤い自転車", "幸福", "愛", "緑の公園のベンチ", "勇気"],
      language: "ja",
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(false);
    expect(data.issues).toBeDefined();
    expect(Array.isArray(data.issues)).toBe(true);

    // Check if abstract concepts are detected
    // Note: Gemini API might not detect all abstract concepts consistently
    // So we check if at least some of the expected abstract concepts are detected
    const abstractConcepts = ["幸福", "愛", "勇気"];
    let detectedCount = 0;
    for (const concept of abstractConcepts) {
      if (data.issues.some((issue: CheckIssue) => issue.subject === concept)) {
        detectedCount++;
      }
    }
    // At least 2 of the 3 abstract concepts should be detected
    expect(detectedCount).toBeGreaterThanOrEqual(2);
  });

  it("should detect vague or ambiguous descriptions in Japanese", async () => {
    // Skip this test if GEMINI_API_KEY is not available
    if (!process.env.GEMINI_API_KEY) {
      return;
    }

    const req = createApiRequest("/api/subjects/check", "POST", {
      subjects: [
        "赤い自転車",
        "何か美しいもの",
        "良い景色",
        "緑の公園のベンチ",
        "面白いもの",
      ],
      language: "ja",
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(false);
    expect(data.issues).toBeDefined();
    expect(Array.isArray(data.issues)).toBe(true);

    // Check if vague descriptions are detected
    const vagueDescriptions = ["何か美しいもの", "良い景色", "面白いもの"];
    for (const description of vagueDescriptions) {
      expect(
        data.issues.some((issue: CheckIssue) => issue.subject === description),
      ).toBe(true);
    }
  });

  it("should detect inappropriate content in Japanese", async () => {
    // Skip this test if GEMINI_API_KEY is not available
    if (!process.env.GEMINI_API_KEY) {
      return;
    }

    const req = createApiRequest("/api/subjects/check", "POST", {
      subjects: [
        "赤い自転車",
        "セックス",
        "タバコ",
        "緑の公園のベンチ",
        "お酒",
      ],
      language: "ja",
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(false);
    expect(data.issues).toBeDefined();
    expect(Array.isArray(data.issues)).toBe(true);

    // Check if inappropriate content is detected
    const inappropriateContent = ["セックス", "タバコ", "お酒"];
    for (const content of inappropriateContent) {
      expect(
        data.issues.some((issue: CheckIssue) => issue.subject === content),
      ).toBe(true);
    }
  });

  it("should detect duplicate or similar items in Japanese", async () => {
    // Skip this test if GEMINI_API_KEY is not available
    if (!process.env.GEMINI_API_KEY) {
      return;
    }

    const req = createApiRequest("/api/subjects/check", "POST", {
      subjects: [
        "赤い自転車",
        "赤いバイク",
        "緑の公園のベンチ",
        "公園のベンチ",
        "白い教会の尖塔",
      ],
      language: "ja",
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(false);
    expect(data.issues).toBeDefined();
    expect(Array.isArray(data.issues)).toBe(true);

    // At least one of the duplicates should be detected
    const duplicates = [
      ["赤い自転車", "赤いバイク"],
      ["緑の公園のベンチ", "公園のベンチ"],
    ];

    for (const [item1, item2] of duplicates) {
      expect(
        data.issues.some(
          (issue: CheckIssue) =>
            issue.subject === item1 || issue.subject === item2,
        ),
      ).toBe(true);
    }
  });

  it("should validate subjects generated by the generate API in English", async () => {
    // Skip this test if GEMINI_API_KEY is not available
    if (!process.env.GEMINI_API_KEY) {
      return;
    }

    // First, generate subjects using the generate API
    const generateReq = createApiRequest("/api/subjects/generate", "POST", {
      title: "Summer Camp",
      theme: "Campsite by the beach",
      language: "en",
      numberOfCandidates: 5,
    });

    const generateResponse = await generatePOST(generateReq);
    const generateData = await generateResponse.json();

    expect(generateResponse.status).toBe(200);
    expect(generateData.candidates).toBeDefined();
    expect(Array.isArray(generateData.candidates)).toBe(true);

    // Then, check the generated subjects using the check API
    const checkReq = createApiRequest("/api/subjects/check", "POST", {
      subjects: generateData.candidates,
      language: "en",
    });

    const checkResponse = await POST(checkReq);
    const checkData = await checkResponse.json();

    // Generated subjects should pass the check
    expect(checkResponse.status).toBe(200);
    expect(checkData.ok).toBe(true);
  });

  it("should validate subjects generated by the generate API in Japanese", async () => {
    // Skip this test if GEMINI_API_KEY is not available
    if (!process.env.GEMINI_API_KEY) {
      return;
    }

    // First, generate subjects using the generate API
    const generateReq = createApiRequest("/api/subjects/generate", "POST", {
      title: "夏祭り",
      theme: "日本の伝統的な夏祭り",
      language: "ja",
      numberOfCandidates: 5,
    });

    const generateResponse = await generatePOST(generateReq);
    const generateData = await generateResponse.json();

    expect(generateResponse.status).toBe(200);
    expect(generateData.candidates).toBeDefined();
    expect(Array.isArray(generateData.candidates)).toBe(true);

    // Then, check the generated subjects using the check API
    const checkReq = createApiRequest("/api/subjects/check", "POST", {
      subjects: generateData.candidates,
      language: "ja",
    });

    const checkResponse = await POST(checkReq);
    const checkData = await checkResponse.json();

    // Generated subjects should pass the check
    expect(checkResponse.status).toBe(200);
    expect(checkData.ok).toBe(true);
  });

  it("should detect issues with problematic subjects mixed with generated ones in English", async () => {
    // Skip this test if GEMINI_API_KEY is not available
    if (!process.env.GEMINI_API_KEY) {
      return;
    }

    // First, generate good subjects using the generate API
    const generateReq = createApiRequest("/api/subjects/generate", "POST", {
      title: "Park",
      theme: "City park",
      language: "en",
      numberOfCandidates: 3,
    });

    const generateResponse = await generatePOST(generateReq);
    const generateData = await generateResponse.json();

    // Add problematic subjects to the good ones
    const mixedSubjects = [
      ...generateData.candidates,
      "Happiness", // abstract concept
      "Something beautiful", // vague description
      "Gun", // inappropriate content
      generateData.candidates[0], // duplicate
    ];

    // Check the mixed subjects
    const checkReq = createApiRequest("/api/subjects/check", "POST", {
      subjects: mixedSubjects,
      language: "en",
    });

    const checkResponse = await POST(checkReq);
    const checkData = await checkResponse.json();

    // Should detect issues with the problematic subjects
    expect(checkResponse.status).toBe(200);
    expect(checkData.ok).toBe(false);
    expect(checkData.issues).toBeDefined();
    expect(Array.isArray(checkData.issues)).toBe(true);

    // Check if problematic subjects are detected
    const problematicSubjects = [
      "Happiness",
      "Something beautiful",
      "Gun",
      generateData.candidates[0],
    ];

    // At least some of the problematic subjects should be detected
    // We don't check all because the AI might not detect all issues
    let detectedCount = 0;
    for (const subject of problematicSubjects) {
      if (
        checkData.issues.some((issue: CheckIssue) => issue.subject === subject)
      ) {
        detectedCount++;
      }
    }

    // At least 2 of the 4 problematic subjects should be detected
    expect(detectedCount).toBeGreaterThanOrEqual(2);
  });

  it("should detect issues with problematic subjects mixed with generated ones in Japanese", async () => {
    // Skip this test if GEMINI_API_KEY is not available
    if (!process.env.GEMINI_API_KEY) {
      return;
    }

    // First, generate good subjects using the generate API
    const generateReq = createApiRequest("/api/subjects/generate", "POST", {
      title: "公園",
      theme: "都市の公園",
      language: "ja",
      numberOfCandidates: 3,
    });

    const generateResponse = await generatePOST(generateReq);
    const generateData = await generateResponse.json();

    // Add problematic subjects to the good ones
    const mixedSubjects = [
      ...generateData.candidates,
      "幸福", // abstract concept
      "何か美しいもの", // vague description
      "銃", // inappropriate content
      generateData.candidates[0], // duplicate
    ];

    // Check the mixed subjects
    const checkReq = createApiRequest("/api/subjects/check", "POST", {
      subjects: mixedSubjects,
      language: "ja",
    });

    const checkResponse = await POST(checkReq);
    const checkData = await checkResponse.json();

    // Should detect issues with the problematic subjects
    expect(checkResponse.status).toBe(200);
    expect(checkData.ok).toBe(false);
    expect(checkData.issues).toBeDefined();
    expect(Array.isArray(checkData.issues)).toBe(true);

    // Check if problematic subjects are detected
    const problematicSubjects = [
      "幸福",
      "何か美しいもの",
      "銃",
      generateData.candidates[0],
    ];

    // At least some of the problematic subjects should be detected
    // We don't check all because the AI might not detect all issues
    let detectedCount = 0;
    for (const subject of problematicSubjects) {
      if (
        checkData.issues.some((issue: CheckIssue) => issue.subject === subject)
      ) {
        detectedCount++;
      }
    }

    // At least 2 of the 4 problematic subjects should be detected
    expect(detectedCount).toBeGreaterThanOrEqual(2);
  });
});
