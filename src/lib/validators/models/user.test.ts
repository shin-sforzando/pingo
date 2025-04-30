import { describe, expect, it } from "vitest";
import { notificationSchema, userSchema } from "./user";

describe("User and Notification Zod Schemas", () => {
  // --- notificationSchema Tests ---
  describe("notificationSchema", () => {
    const validNotificationData = {
      id: "01J0Z4J3ZG6X7X7X7X7X7X7X7X", // Valid ULID
      type: "game_invite" as const,
      displayType: "popup" as const,
      message: "You were invited!",
      createdAt: new Date(),
      read: false,
      relatedGameId: "ABCDEF", // Valid Game ID
      details: { inviterId: "user_789" },
    };

    it("should validate correct notification data", () => {
      const result = notificationSchema.safeParse(validNotificationData);
      expect(
        result.success,
        `Validation failed: ${JSON.stringify(result.error?.flatten())}`,
      ).toBe(true);
    });

    it("should apply default value for read", () => {
      const { read, ...dataWithoutRead } = validNotificationData;
      const result = notificationSchema.safeParse(dataWithoutRead);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.read).toBe(false); // Check default value
      }
    });

    it("should invalidate data with invalid ULID", () => {
      const invalidData = { ...validNotificationData, id: "invalid-ulid" };
      expect(notificationSchema.safeParse(invalidData).success).toBe(false);
    });

    it("should invalidate data with invalid type enum", () => {
      const invalidData = { ...validNotificationData, type: "invalid_type" };
      expect(notificationSchema.safeParse(invalidData).success).toBe(false);
    });

    it("should invalidate data with invalid displayType enum", () => {
      const invalidData = {
        ...validNotificationData,
        displayType: "invalid_display",
      };
      expect(notificationSchema.safeParse(invalidData).success).toBe(false);
    });

    it("should invalidate data with empty message", () => {
      const invalidData = { ...validNotificationData, message: "" };
      expect(notificationSchema.safeParse(invalidData).success).toBe(false);
    });

    it("should invalidate data with invalid relatedGameId", () => {
      const invalidData = {
        ...validNotificationData,
        relatedGameId: "invalid",
      };
      expect(notificationSchema.safeParse(invalidData).success).toBe(false);
    });

    it("should allow optional fields to be missing", () => {
      const { relatedGameId, details, ...dataWithoutOptional } =
        validNotificationData;
      expect(notificationSchema.safeParse(dataWithoutOptional).success).toBe(
        true,
      );
    });
  });

  // --- userSchema Tests ---
  describe("userSchema", () => {
    const validUserData = {
      id: "firebase_uid_1234567890", // Example Firebase UID
      handle: "TestUser_123",
      createdAt: new Date("2023-01-01T00:00:00Z"),
      lastLoginAt: new Date(),
      participatingGames: ["ABCDEF", "GHIJKL"], // Max 5 allowed
      gameHistory: ["UVWXYZ"],
      settings: { theme: "dark" },
      note: "Test user for validation",
    };

    it("should validate correct user data", () => {
      const result = userSchema.safeParse(validUserData);
      expect(
        result.success,
        `Validation failed: ${JSON.stringify(result.error?.flatten())}`,
      ).toBe(true);
    });

    it("should allow missing optional fields (settings, note)", () => {
      const { settings, note, ...dataWithoutOptional } = validUserData;
      const result = userSchema.safeParse(dataWithoutOptional);
      expect(result.success).toBe(true);
    });

    it("should allow empty arrays for games", () => {
      const dataWithEmptyGames = {
        ...validUserData,
        participatingGames: [],
        gameHistory: [],
      };
      const result = userSchema.safeParse(dataWithEmptyGames);
      expect(result.success).toBe(true);
    });

    it("should invalidate data with empty id", () => {
      const invalidData = { ...validUserData, id: "" };
      expect(userSchema.safeParse(invalidData).success).toBe(false);
    });

    it("should invalidate data with id exceeding 128 characters", () => {
      const longId = "a".repeat(129); // 129 characters
      const invalidData = { ...validUserData, id: longId };
      expect(userSchema.safeParse(invalidData).success).toBe(false);
    });

    it("should validate data with id of maximum length (128 characters)", () => {
      const maxLengthId = "a".repeat(128); // 128 characters
      const validData = { ...validUserData, id: maxLengthId };
      expect(userSchema.safeParse(validData).success).toBe(true);
    });

    it("should invalidate data with invalid handle format", () => {
      expect(
        userSchema.safeParse({ ...validUserData, handle: "Us" }).success,
      ).toBe(false); // Too short
      expect(
        userSchema.safeParse({
          ...validUserData,
          handle: "Test User With Spaces",
        }).success,
      ).toBe(false); // Spaces
      expect(
        userSchema.safeParse({ ...validUserData, handle: "Test-User" }).success,
      ).toBe(false); // Hyphen
      expect(
        userSchema.safeParse({
          ...validUserData,
          handle: "VeryLongHandleThatExceedsTheLimit123456",
        }).success,
      ).toBe(false); // Too long (exceeds 24 characters)
    });

    it("should validate handle with Japanese characters", () => {
      const validData = { ...validUserData, handle: "日本語ハンドル123" };
      expect(userSchema.safeParse(validData).success).toBe(true);
    });

    it("should validate handle with maximum length (24 characters)", () => {
      const maxLengthHandle = "a".repeat(24); // 24 characters
      const validData = { ...validUserData, handle: maxLengthHandle };
      expect(userSchema.safeParse(validData).success).toBe(true);
    });

    it("should invalidate data with more than 5 participating games", () => {
      const validGameIds = Array.from({ length: 6 }, (_, i) =>
        String.fromCharCode(65 + i).repeat(6),
      );
      const invalidDataWithValidIds = {
        ...validUserData,
        participatingGames: validGameIds,
      };
      expect(userSchema.safeParse(invalidDataWithValidIds).success).toBe(false);
    });

    it("should invalidate data with invalid game IDs in arrays", () => {
      const invalidData = {
        ...validUserData,
        participatingGames: ["ABCDEF", "invalid"],
      };
      expect(userSchema.safeParse(invalidData).success).toBe(false);
    });

    it("should validate data with note field", () => {
      const validData = {
        ...validUserData,
        note: "This is an administrative note.",
      };
      expect(userSchema.safeParse(validData).success).toBe(true);
    });
  });
});
