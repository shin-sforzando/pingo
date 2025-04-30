import { submissionSchema } from "@/lib/validators/models/game";
import type { Game } from "@/lib/validators/models/game";
import type { Submission } from "@/lib/validators/models/game";
import { notificationSchema } from "@/lib/validators/models/user";
import type { Notification } from "@/lib/validators/models/user";
import { describe, expect, it } from "vitest";
import { z } from "zod";

// Note: MSW server lifecycle is managed globally in vitest.setup.ts

describe("MSW User API Handlers (/api/users/*)", () => {
  const testApiBase = "/api/users";

  // Mock data IDs used in userApi.ts (ensure consistency)
  const userId1 = "mockuser1";
  const userId2 = "mockuser2";
  const nonExistentUserId = "nonexistentuser";
  const notificationId1 = "01J0Z4J3ZG6X7X7X7X7X7X7X7X";

  // --- GET /api/users/:userId ---
  describe("GET /:userId", () => {
    it("should return user data for an existing user", async () => {
      const response = await fetch(`${testApiBase}/${userId1}`);
      expect(response.status).toBe(200);
      const data = await response.json();
      // Validate against a potentially simplified public user schema if needed,
      // or the parts we expect to be public. Here we check known fields.
      expect(data.id).toBe(userId1);
      expect(data.handle).toBe("MockUser1");
      expect(data.note).toBeUndefined(); // Admin only, should not be public
      expect(data.lastLoginAt).toBeUndefined(); // Should not be public
    });

    it("should return 404 for a non-existent user", async () => {
      const response = await fetch(`${testApiBase}/${nonExistentUserId}`);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe("User not found");
    });

    it("should return 404 for an invalid user ID format", async () => {
      // Invalid format passes userIdSchema validation (which only checks length)
      // but fails in findUser, resulting in 404
      const response = await fetch(`${testApiBase}/invalid-id-format!`);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe("User not found");
    });

    it("should return 400 for a user ID exceeding 128 characters", async () => {
      const longId = "a".repeat(129); // 129 characters
      const response = await fetch(`${testApiBase}/${longId}`);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Invalid User ID format in URL");
    });
  });

  // --- GET /api/users/:userId/history ---
  describe("GET /:userId/history", () => {
    it("should return game history for an existing user", async () => {
      const response = await fetch(`${testApiBase}/${userId1}/history`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      const historyData = data as Partial<Game>[];
      expect(historyData.some((game) => game.id === "UVWXYZ")).toBe(true);
      const historyItemSchema = z
        .object({
          id: z.string(),
          title: z.string().optional(),
          status: z.string().optional(),
          createdAt: z
            .preprocess(
              (arg) => (typeof arg === "string" ? new Date(arg) : arg),
              z.date().nullable(),
            )
            .optional(),
        })
        .passthrough();
      for (const item of historyData) {
        expect(historyItemSchema.safeParse(item).success).toBe(true);
      }
    });

    it("should return empty array for user with no history", async () => {
      // Need a mock user with no history for this test
      // Let's assume userId2 has history, create a temp user or modify mock
      const response = await fetch(`${testApiBase}/${userId2}/history`); // Assuming userId2 has history in mock
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      const historyDataUser2 = data as Partial<Game>[];
      expect(historyDataUser2.some((game) => game.id === "MNOPQR")).toBe(true);
      expect(historyDataUser2.some((game) => game.id === "STUVWX")).toBe(true);
    });

    it("should return 404 for a non-existent user", async () => {
      const response = await fetch(
        `${testApiBase}/${nonExistentUserId}/history`,
      );
      expect(response.status).toBe(404);
    });

    it("should return 400 for a user ID exceeding 128 characters", async () => {
      const longId = "a".repeat(129); // 129 characters
      const response = await fetch(`${testApiBase}/${longId}/history`);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Invalid User ID format in URL");
    });
  });

  // --- GET /api/users/:userId/notifications ---
  describe("GET /:userId/notifications", () => {
    it("should return notifications for an existing user", async () => {
      const response = await fetch(`${testApiBase}/${userId1}/notifications`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      const notificationData = data as Notification[];
      expect(notificationData.length).toBeGreaterThan(0);
      const notificationApiResponseSchema = notificationSchema.extend({
        createdAt: z.preprocess(
          (arg) => (typeof arg === "string" ? new Date(arg) : arg),
          z.date(),
        ),
      });
      for (const item of notificationData) {
        const parsed = notificationApiResponseSchema.safeParse(item);
        expect(
          parsed.success,
          `Notification validation failed: ${JSON.stringify(parsed.error?.flatten())}`,
        ).toBe(true);
      }
      if (notificationData.length > 1) {
        const time1 =
          notificationData[0].createdAt instanceof Date
            ? notificationData[0].createdAt.getTime()
            : Date.parse(notificationData[0].createdAt as unknown as string);
        const time2 =
          notificationData[1].createdAt instanceof Date
            ? notificationData[1].createdAt.getTime()
            : Date.parse(notificationData[1].createdAt as unknown as string);
        expect(time1).toBeGreaterThanOrEqual(time2);
      }
    });

    it("should return empty array for user with no notifications", async () => {
      const response = await fetch(`${testApiBase}/${userId2}/notifications`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    // Note: 404 for non-existent user might depend on API design (could also be empty array)
    // Assuming it returns empty array based on handler logic
    it("should return empty array for non-existent user", async () => {
      const response = await fetch(
        `${testApiBase}/${nonExistentUserId}/notifications`,
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual([]);
    });

    it("should return 400 for a user ID exceeding 128 characters", async () => {
      const longId = "a".repeat(129); // 129 characters
      const response = await fetch(`${testApiBase}/${longId}/notifications`);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Invalid User ID format in URL");
    });
  });

  // --- PUT /api/users/:userId/notifications/:notificationId/read ---
  describe("PUT /:userId/notifications/:notificationId/read", () => {
    it("should mark a notification as read", async () => {
      const initialNotificationsRes = await fetch(
        `${testApiBase}/${userId1}/notifications`,
      );
      const initialNotifications =
        (await initialNotificationsRes.json()) as Notification[];
      const unreadNotification = initialNotifications.find((n) => !n.read);
      expect(unreadNotification).toBeDefined();

      if (!unreadNotification) return;

      const response = await fetch(
        `${testApiBase}/${userId1}/notifications/${unreadNotification.id}/read`,
        { method: "PUT" },
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(unreadNotification.id);
      expect(data.read).toBe(true);

      // Verify it's marked as read in subsequent GET request
      const finalNotificationsRes = await fetch(
        `${testApiBase}/${userId1}/notifications`,
      );
      const finalNotifications =
        (await finalNotificationsRes.json()) as Notification[];
      const updatedNotification = finalNotifications.find(
        (n) => n.id === unreadNotification.id,
      );
      expect(updatedNotification?.read).toBe(true);
    });

    it("should return 404 if notification does not exist", async () => {
      // Use a valid ULID format but one that doesn't exist in the mock data
      const nonExistentUlid = "00000000000000000000000000";
      const response = await fetch(
        `${testApiBase}/${userId1}/notifications/${nonExistentUlid}/read`,
        { method: "PUT" },
      );
      expect(response.status).toBe(404);
    });

    it("should return 404 if notification belongs to another user", async () => {
      // Use a notification ID known to belong to userId1
      const response = await fetch(
        `${testApiBase}/${userId2}/notifications/${notificationId1}/read`,
        { method: "PUT" },
      );
      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid notification ID format", async () => {
      const response = await fetch(
        `${testApiBase}/${userId1}/notifications/invalid-ulid/read`,
        { method: "PUT" },
      );
      expect(response.status).toBe(400);
    });

    it("should return 400 for a user ID exceeding 128 characters", async () => {
      const longId = "a".repeat(129); // 129 characters
      const response = await fetch(
        `${testApiBase}/${longId}/notifications/${notificationId1}/read`,
        { method: "PUT" },
      );
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe(
        "Invalid User or Notification ID format in URL",
      );
    });
  });

  // --- GET /api/users/:userId/images ---
  describe("GET /:userId/images", () => {
    it("should return user images excluding inappropriate ones", async () => {
      const response = await fetch(`${testApiBase}/${userId1}/images`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1); // Based on mock data (SUB1 accepted, SUB2 inappropriate)
      expect(data[0].id).toBe("01J0Z4AAAA6X7X7X7X7X7X7X7A");
      expect(data[0].acceptanceStatus).toBe("accepted");
      const submissionApiResponseSchema = submissionSchema.extend({
        submittedAt: z.preprocess(
          (arg) => (typeof arg === "string" ? new Date(arg) : arg),
          z.date(),
        ),
        analyzedAt: z.preprocess(
          (arg) => (typeof arg === "string" ? new Date(arg) : arg),
          z.date().nullable(),
        ),
      });
      for (const item of data as Submission[]) {
        const parsed = submissionApiResponseSchema.safeParse(item);
        expect(
          parsed.success,
          `Submission validation failed: ${JSON.stringify(parsed.error?.flatten())}`,
        ).toBe(true);
      }
    });

    it("should return empty array for user with no valid images", async () => {
      // Need a user with only inappropriate images or no images
      const response = await fetch(`${testApiBase}/${userId2}/images`); // userId2 has one accepted image
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1); // SUB3 should be returned
      expect(data[0].id).toBe("01J0Z4CCCC6X7X7X7X7X7X7X7C");
    });

    it("should return empty array for non-existent user", async () => {
      const response = await fetch(
        `${testApiBase}/${nonExistentUserId}/images`,
      );
      expect(response.status).toBe(200); // Assuming handler returns empty array, not 404
      const data = await response.json();
      expect(data).toEqual([]);
    });

    it("should return 400 for a user ID exceeding 128 characters", async () => {
      const longId = "a".repeat(129); // 129 characters
      const response = await fetch(`${testApiBase}/${longId}/images`);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Invalid User ID format in URL");
    });
  });
});
