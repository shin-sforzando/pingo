import { http, HttpResponse } from "msw";
import { z } from "zod";
import { ulidSchema } from "../../validators/common";
import type { gameSchema as gameSchemaType } from "../../validators/models/game";
import { submissionSchema } from "../../validators/models/game";
import { notificationSchema, userSchema } from "../../validators/models/user";

// --- Mock Data Store (Simplified for User API) ---
// This store is local to these handlers. In a real app or more complex mock setup,
// state might be shared or managed differently (e.g., using msw-data).
const mockUser1: z.infer<typeof userSchema> = userSchema.parse({
  id: "mockuser1",
  handle: "MockUser1",
  createdAt: new Date("2024-01-01T10:00:00Z"),
  lastLoginAt: new Date(),
  participatingGames: ["ABCDEF", "GHIJKL"],
  gameHistory: ["UVWXYZ"],
  profile: {
    displayName: "Mock User One",
    avatarUrl: "https://via.placeholder.com/150/0000FF/808080?text=M1",
  },
  settings: { theme: "light" },
});
const mockUser2: z.infer<typeof userSchema> = userSchema.parse({
  id: "mockuser2",
  handle: "MockUser2",
  createdAt: new Date("2024-02-15T12:30:00Z"),
  lastLoginAt: new Date(),
  participatingGames: ["GHIJKL"],
  gameHistory: ["MNOPQR", "STUVWX"],
  profile: { displayName: "Mock User Two" },
  settings: {},
});
// Exporting mockUsersDb for potential use in other handlers (e.g., enriching participant lists)
// Note: This creates coupling between handler files. A shared mock data module might be better for larger scale.
export const mockUsersDb: z.infer<typeof userSchema>[] = [mockUser1, mockUser2];

// Mock notifications for mockuser1
const mockNotificationsDb: Record<
  string,
  z.infer<typeof notificationSchema>[]
> = {
  mockuser1: [
    notificationSchema.parse({
      id: "01J0Z4J3ZG6X7X7X7X7X7X7X7X",
      type: "game_invite",
      displayType: "popup",
      message: "You were invited to ABCDEF!",
      createdAt: new Date("2024-04-27T10:00:00Z"),
      read: false,
      relatedGameId: "ABCDEF",
    }),
    notificationSchema.parse({
      id: "01J0Z4J4ZG6X7X7X7X7X7X7X7Y",
      type: "submission_accepted",
      displayType: "toast",
      message: "Your photo for ABCDEF was accepted!",
      createdAt: new Date("2024-04-28T11:00:00Z"),
      read: true,
      relatedGameId: "ABCDEF",
      details: { submissionId: "01J0Z4KAZG6X7X7X7X7X7X7X7A" },
    }),
    notificationSchema.parse({
      id: "01J0Z4J5ZG6X7X7X7X7X7X7X7Z",
      type: "line_complete",
      displayType: "inline",
      message: "You completed a line in GHIJKL!",
      createdAt: new Date("2024-04-28T12:00:00Z"),
      read: false,
      relatedGameId: "GHIJKL",
      details: { lineType: "row", lineIndex: 1 },
    }),
  ],
  mockuser2: [],
};

// Mock submissions (simplified) - Using parse to ensure schema conformance
const mockSubmissionsDb: z.infer<typeof submissionSchema>[] = [
  submissionSchema.parse({
    id: "01J0Z4KAZG6X7X7X7X7X7X7X7A",
    userId: "mockuser1",
    imageUrl: "/mock/image1.jpg",
    submittedAt: new Date("2024-04-28T10:55:00Z"),
    analyzedAt: new Date("2024-04-28T10:56:00Z"),
    processingStatus: "analyzed",
    acceptanceStatus: "accepted",
    matchedCellId: "cell-1-1",
    confidence: 0.9,
  }),
  submissionSchema.parse({
    id: "01J0Z4KBZG6X7X7X7X7X7X7X7B",
    userId: "mockuser1",
    imageUrl: "/mock/image2.jpg",
    submittedAt: new Date("2024-04-28T13:00:00Z"),
    analyzedAt: new Date("2024-04-28T13:01:00Z"),
    processingStatus: "analyzed",
    acceptanceStatus: "inappropriate_content",
    matchedCellId: null,
    confidence: null,
    errorMessage: "Image flagged by moderation.",
  }),
  submissionSchema.parse({
    id: "01J0Z4KCZG6X7X7X7X7X7X7X7C",
    userId: "mockuser2",
    imageUrl: "/mock/image3.jpg",
    submittedAt: new Date("2024-04-28T09:15:00Z"),
    analyzedAt: new Date("2024-04-28T09:16:00Z"),
    processingStatus: "analyzed",
    acceptanceStatus: "accepted",
    matchedCellId: "cell-2-2",
    confidence: 0.8,
  }),
];

// Mock games (simplified for history) - Using partial schema for brevity
const mockGamesDb: Record<string, Partial<z.infer<typeof gameSchemaType>>> = {
  UVWXYZ: {
    id: "UVWXYZ",
    title: "Old Game Alpha",
    status: "ended",
    createdAt: new Date("2023-11-01"),
  },
  MNOPQR: {
    id: "MNOPQR",
    title: "Beta Test Game",
    status: "ended",
    createdAt: new Date("2023-12-01"),
  },
  STUVWX: {
    id: "STUVWX",
    title: "Weekend Challenge",
    status: "ended",
    createdAt: new Date("2024-01-15"),
  },
  ABCDEF: {
    id: "ABCDEF",
    title: "Active Game 1",
    status: "active",
    createdAt: new Date("2024-04-27"),
  },
  GHIJKL: {
    id: "GHIJKL",
    title: "Active Game 2",
    status: "active",
    createdAt: new Date("2024-04-20"),
  },
};

// --- Helper Functions ---
const findUser = (userId: string) => mockUsersDb.find((u) => u.id === userId);
const getUserNotifications = (userId: string) =>
  mockNotificationsDb[userId] || [];
const findNotificationIndex = (userId: string, notificationId: string) =>
  getUserNotifications(userId).findIndex((n) => n.id === notificationId);
const getUserSubmissions = (userId: string) =>
  mockSubmissionsDb.filter((s) => s.userId === userId);
const getGameDetails = (gameId: string) => mockGamesDb[gameId];

// --- MSW Handlers for /api/users/* ---

export const userApiHandlers = [
  /**
   * GET /api/users/:userId
   * Retrieves public profile information for a given user.
   */
  http.get("/api/users/:userId", ({ params }) => {
    // Validate userId from path parameter
    const userIdResult = z.string().min(1).safeParse(params.userId);
    if (!userIdResult.success) {
      return HttpResponse.json(
        { message: "Invalid User ID format in URL" },
        { status: 400 },
      );
    }
    const userId = userIdResult.data;

    const user = findUser(userId);
    if (!user) {
      return HttpResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Decide what data is public. For now, returning a subset.
    // In a real app, never return sensitive fields like email (if stored) or full settings.
    const publicUserData = {
      id: user.id,
      handle: user.handle,
      createdAt: user.createdAt, // Might be considered public
      profile: user.profile,
      // Omit: lastLoginAt, participatingGames, gameHistory, settings
    };
    return HttpResponse.json(publicUserData);
  }),

  /**
   * GET /api/users/:userId/history
   * Retrieves a list of games the user has previously participated in.
   */
  http.get("/api/users/:userId/history", ({ params }) => {
    const userIdResult = z.string().min(1).safeParse(params.userId);
    if (!userIdResult.success) {
      return HttpResponse.json(
        { message: "Invalid User ID format in URL" },
        { status: 400 },
      );
    }
    const userId = userIdResult.data;

    const user = findUser(userId);
    if (!user) {
      return HttpResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Map game IDs from history to simplified game details from our mock DB.
    const historyDetails = user.gameHistory
      .map((gameId) => getGameDetails(gameId))
      .filter((game) => game !== undefined) // Filter out potential undefineds
      .map((game) => ({
        // Return only essential details for history view
        id: game?.id,
        title: game?.title,
        status: game?.status,
        createdAt: game?.createdAt, // Or maybe completedAt if tracked
      }));

    // Sort history, e.g., by creation date descending
    historyDetails.sort(
      (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
    );

    return HttpResponse.json(historyDetails);
  }),

  /**
   * GET /api/users/:userId/notifications
   * Retrieves notifications for the specified user.
   */
  http.get("/api/users/:userId/notifications", ({ params }) => {
    const userIdResult = z.string().min(1).safeParse(params.userId);
    if (!userIdResult.success) {
      return HttpResponse.json(
        { message: "Invalid User ID format in URL" },
        { status: 400 },
      );
    }
    const userId = userIdResult.data;

    // It's okay if a user exists but has no notifications (returns empty array).
    // No need to check user existence unless API requires it.
    const notifications = getUserNotifications(userId);

    // Sort by createdAt descending for typical display order.
    const sortedNotifications = [...notifications].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    return HttpResponse.json(sortedNotifications);
  }),

  /**
   * PUT /api/users/:userId/notifications/:notificationId/read
   * Marks a specific notification as read for the user.
   */
  http.put(
    "/api/users/:userId/notifications/:notificationId/read",
    ({ params }) => {
      // Validate both IDs
      const userIdResult = z.string().min(1).safeParse(params.userId);
      const notificationIdResult = ulidSchema.safeParse(params.notificationId); // Use ULID schema

      if (!userIdResult.success || !notificationIdResult.success) {
        return HttpResponse.json(
          { message: "Invalid User or Notification ID format in URL" },
          { status: 400 },
        );
      }
      const userId = userIdResult.data;
      const notificationId = notificationIdResult.data;

      // Find the index of the notification in the user's list
      const notificationIndex = findNotificationIndex(userId, notificationId);

      if (notificationIndex === -1) {
        return HttpResponse.json(
          { message: "Notification not found for this user" },
          { status: 404 },
        );
      }

      // Update the 'read' status if it's not already true
      if (!mockNotificationsDb[userId][notificationIndex].read) {
        mockNotificationsDb[userId][notificationIndex].read = true;
        console.log(
          `[MSW] Marked notification ${notificationId} for user ${userId} as read.`,
        );
      }

      // Return the updated notification object
      return HttpResponse.json(mockNotificationsDb[userId][notificationIndex]);
    },
  ),

  /**
   * GET /api/users/:userId/images
   * Retrieves a list of images submitted by the user (excluding inappropriate ones).
   */
  http.get("/api/users/:userId/images", ({ params }) => {
    const userIdResult = z.string().min(1).safeParse(params.userId);
    if (!userIdResult.success) {
      return HttpResponse.json(
        { message: "Invalid User ID format in URL" },
        { status: 400 },
      );
    }
    const userId = userIdResult.data;

    // No need to check user existence unless required by API spec.

    const userImages = getUserSubmissions(userId)
      // Filter out inappropriate content as per TechnicalSpecification.md
      .filter((sub) => sub.acceptanceStatus !== "inappropriate_content");

    // Sort by submission time descending (most recent first).
    const sortedImages = [...userImages].sort(
      (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime(),
    );

    // Return the filtered and sorted list of submissions.
    // Could potentially map to a simpler structure if only image URLs are needed.
    return HttpResponse.json(sortedImages);
  }),
];
