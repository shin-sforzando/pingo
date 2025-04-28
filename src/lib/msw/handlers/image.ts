import { http, HttpResponse } from "msw";
import { z } from "zod";
import { gameIdSchema, ulidSchema } from "../../validators/common";
// Accessing mock data defined in other handlers is complex and creates coupling.
// For a robust mock setup, consider a dedicated shared mock data module/store.
// For now, we'll simulate results without deep interaction with other mock stores.

// --- Schemas for Request Bodies ---

// Schema for requesting a signed URL for upload.
const getUploadUrlSchema = z.object({
  filename: z.string().min(1, { message: "Filename cannot be empty." }),
  contentType: z.string().regex(/^image\/(jpeg|png|heic|webp|gif)$/, {
    // Allow common image types
    message: "Invalid image content type.",
  }),
  gameId: gameIdSchema, // Associate upload with a specific game
});

// Schema for notifying the backend after successful upload to GCS.
const processImageSchema = z.object({
  imageUrl: z.string().min(1), // URL/path from GCS (or the mock path returned by getUploadUrl)
  gameId: gameIdSchema,
  // userId should ideally come from the authenticated session on the backend/mock.
  // Including it here for mock simplicity if session isn't fully mocked yet.
  userId: z.string().min(1),
  // Client might generate a ULID beforehand to track the submission process.
  submissionId: ulidSchema,
});

// --- MSW Handlers for /api/images/* ---

export const imageHandlers = [
  /**
   * POST /api/images/getUploadUrl
   * Simulates generating a signed URL for direct GCS upload.
   * In reality, this involves backend interaction with GCS SDK.
   */
  http.post("/api/images/getUploadUrl", async ({ request }) => {
    // TODO: Implement mock authentication check (e.g., check currentMockUserId)
    // if (!currentMockUserId) return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
      const body = await request.json();
      const parsedBody = getUploadUrlSchema.safeParse(body);

      if (!parsedBody.success) {
        return HttpResponse.json(
          {
            message: "Invalid request body for upload URL",
            errors: parsedBody.error.flatten(),
          },
          { status: 400 },
        );
      }

      const { filename, contentType, gameId } = parsedBody.data;

      // Generate a *fake* signed URL for the mock environment.
      // This URL isn't actually usable for uploading but mimics the structure.
      const mockUploadUrl = `https://mock-storage.googleapis.com/upload/${gameId}/${ulidSchema.parse(Date.now().toString(36) + Math.random().toString(36).substring(2))}-${filename}?signature=mock_signature&expires=${Date.now() + 300000}`; // Expires in 5 mins

      // Generate the expected final path/URL after a successful "upload".
      // This is what the client might send to the /process endpoint later.
      const mockFinalImageUrl = `gs://pingo-images/${gameId}/${ulidSchema.parse(Date.now().toString(36) + Math.random().toString(36).substring(2))}-${filename}`; // Example GCS path

      console.log(
        `[MSW] Generated mock upload URL for ${filename} (type: ${contentType}) in game ${gameId}`,
      );

      // Return both the URL the client should use for the PUT request (mockUploadUrl)
      // and the final URL/path the backend expects (mockFinalImageUrl).
      return HttpResponse.json({
        uploadUrl: mockUploadUrl,
        imageUrl: mockFinalImageUrl,
      });
    } catch (error) {
      console.error("[MSW] /api/images/getUploadUrl Error:", error);
      return HttpResponse.json(
        { message: "Internal server error generating upload URL" },
        { status: 500 },
      );
    }
  }),

  /**
   * POST /api/images/process
   * Simulates backend processing after image upload notification:
   * 1. (Mock) Verify image exists at `imageUrl`.
   * 2. (Mock) Perform content moderation check.
   * 3. (Mock) Perform AI analysis for bingo subject matching.
   * 4. (Mock) Update the corresponding Submission document state.
   */
  http.post("/api/images/process", async ({ request }) => {
    // TODO: Implement mock authentication check
    // if (!currentMockUserId) return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
      const body = await request.json();
      const parsedBody = processImageSchema.safeParse(body);

      if (!parsedBody.success) {
        return HttpResponse.json(
          {
            message: "Invalid image processing request body",
            errors: parsedBody.error.flatten(),
          },
          { status: 400 },
        );
      }

      // Destructure needed variables. gameId and userId might be used for more complex logic later (e.g., checking game status, user permissions).
      const { imageUrl, submissionId } = parsedBody.data;

      console.log(
        `[MSW] Simulating processing for image ${imageUrl} (Submission: ${submissionId})`,
      );

      // --- Simulate Processing Delay ---
      // Adds realism and helps test loading states in the UI.
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 1500 + 500),
      ); // 0.5s to 2s delay

      // --- Simulate Content Check ---
      // Simple mock: reject if filename contains "bad"
      const isAppropriate = !imageUrl.toLowerCase().includes("bad");
      if (!isAppropriate) {
        console.log(`[MSW] Image ${imageUrl} flagged as inappropriate.`);
        // TODO: Update actual mock submission in a shared store if implemented.
        // For now, just return the outcome.
        const result = {
          submissionId,
          processingStatus: "error", // Or a specific 'moderation_failed' status
          acceptanceStatus: "inappropriate_content",
          errorMessage: "Image flagged by content moderation.",
          matchedCellId: null,
          confidence: null,
        };
        // Use 200 OK as the processing itself succeeded, but the content failed.
        // API could also use 400 Bad Request if inappropriate content is considered a client error.
        return HttpResponse.json(result, { status: 200 });
      }

      // --- Simulate AI Analysis ---
      const analysisResult = {
        matchedCellId: null as string | null,
        confidence: null as number | null,
      };
      // Mock logic: ~75% chance of matching a random cell
      if (Math.random() < 0.75) {
        // Generate a random cell ID like "cell-x-y"
        analysisResult.matchedCellId = `cell-${Math.floor(Math.random() * 5)}-${Math.floor(Math.random() * 5)}`;
        // Generate a confidence score between 0.5 and 1.0
        analysisResult.confidence = Math.random() * 0.5 + 0.5;
        console.log(
          `[MSW] Image ${imageUrl} mock-matched cell ${analysisResult.matchedCellId} (Confidence: ${analysisResult.confidence?.toFixed(2)})`,
        );
      } else {
        console.log(`[MSW] Image ${imageUrl} did not mock-match any cell.`);
      }

      // TODO: Update actual mock submission in a shared store if implemented.
      // e.g., find submission by ID, update status, matchedCellId, confidence, analyzedAt.

      // Return the simulated analysis result
      const result = {
        submissionId,
        processingStatus: "analyzed",
        // Determine acceptance based on mock confidence and a mock threshold (e.g., 0.6)
        acceptanceStatus:
          (analysisResult.confidence ?? 0) > 0.6 ? "accepted" : "no_match",
        matchedCellId: analysisResult.matchedCellId,
        confidence: analysisResult.confidence,
        analyzedAt: new Date(), // Set analysis time
      };
      return HttpResponse.json(result, { status: 200 });
    } catch (error) {
      console.error("[MSW] /api/images/process Error:", error);
      return HttpResponse.json(
        { message: "Internal server error during image processing simulation" },
        { status: 500 },
      );
    }
  }),

  // Note: Endpoints like GET /api/games/:gameId/images and
  // GET /api/games/:gameId/cells/:cellId/images are likely better placed
  // within the `gameHandlers` as they primarily query game-related data,
  // potentially filtered by image properties. Keeping handlers grouped by
  // the main resource they operate on often improves organization.
];
