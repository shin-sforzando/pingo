import { Timestamp } from "firebase/firestore";
import { describe, expect, it, vi } from "vitest";
import { timestampHelpers } from "./Timestamp";
import { type User, userConverter, userSchema } from "./User";

// Mock types for testing
type MockSnapshot = {
  data: (options?: unknown) => Record<string, unknown> | undefined;
};

describe("User model", () => {
  // Timestamp testing
  describe("timestampHelpers", () => {
    it("should create a Timestamp from a Date", () => {
      const date = new Date();
      const timestamp = timestampHelpers.fromDate(date);

      expect(timestamp).toBeInstanceOf(Timestamp);
      expect(timestamp.toDate().getTime()).toBe(date.getTime());
    });

    it("should create a Timestamp from an ISO string", () => {
      const dateStr = "2025-05-09T12:00:00.000Z";
      const timestamp = timestampHelpers.fromDate(dateStr);

      expect(timestamp).toBeInstanceOf(Timestamp);
      expect(timestamp.toDate().toISOString()).toBe(dateStr);
    });

    it("should get current timestamp", () => {
      const now = new Date();
      // Mock Date.now() to return a fixed timestamp
      const originalNow = Date.now;
      Date.now = vi.fn(() => now.getTime());

      const timestamp = timestampHelpers.now();

      expect(timestamp).toBeInstanceOf(Timestamp);
      // Allow small difference for test reliability
      expect(
        Math.abs(timestamp.toDate().getTime() - now.getTime()),
      ).toBeLessThan(100);

      // Restore original Date.now
      Date.now = originalNow;
    });

    it("should format timestamp to ISO string", () => {
      const date = new Date("2025-05-09T12:00:00.000Z");
      const timestamp = Timestamp.fromDate(date);
      const formatted = timestampHelpers.format(timestamp);

      expect(formatted).toBe("2025-05-09T12:00:00.000Z");
    });
  });

  // User schema validation testing
  describe("userSchema", () => {
    it("should validate a valid user", () => {
      const now = Timestamp.now();
      const validUser = {
        id: "123456",
        username: "John Doe",
        passwordHash: "hashed_password",
        createdAt: now,
        lastLoginAt: now,
        participatingGames: [],
        gameHistory: [],
        memo: "",
        isTestUser: true,
      };

      const result = userSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("should reject username that is too short", () => {
      const now = Timestamp.now();
      const invalidUser = {
        id: "123456",
        username: "te", // Too short
        passwordHash: "hashed_password",
        createdAt: now,
        lastLoginAt: now,
        participatingGames: [],
        gameHistory: [],
        memo: "",
        isTestUser: true,
      };

      const result = userSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("username");
      }
    });

    it("should reject username with invalid characters", () => {
      const now = Timestamp.now();
      const invalidUser = {
        id: "123456",
        username: "John.Doe", // Contains invalid character '.'
        passwordHash: "hashed_password",
        createdAt: now,
        lastLoginAt: now,
        participatingGames: [],
        gameHistory: [],
        memo: "",
        isTestUser: true,
      };

      const result = userSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("username");
      }
    });

    it("should apply default values for optional fields", () => {
      const now = Timestamp.now();
      const minimalUser = {
        id: "123456",
        username: "John Doe",
        passwordHash: "hashed_password",
        createdAt: now,
        lastLoginAt: now,
      };

      const result = userSchema.safeParse(minimalUser);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.participatingGames).toEqual([]);
        expect(result.data.gameHistory).toEqual([]);
        expect(result.data.memo).toBe("");
        expect(result.data.isTestUser).toBe(false);
      }
    });
  });

  // Converter testing
  describe("userConverter", () => {
    it("should convert User to Firestore document", () => {
      const now = Timestamp.now();
      const user: User = {
        id: "123456",
        username: "John Doe",
        passwordHash: "hashed_password",
        createdAt: now,
        lastLoginAt: now,
        participatingGames: ["AAAAAA", "BBBBBB"],
        gameHistory: ["SAMPLE"],
        memo: "test memo",
        isTestUser: true,
      };

      const firestoreDoc = userConverter.toFirestore(user);

      expect(firestoreDoc).toEqual({
        id: "123456",
        username: "John Doe",
        passwordHash: "hashed_password",
        createdAt: now,
        lastLoginAt: now,
        participatingGames: ["AAAAAA", "BBBBBB"],
        gameHistory: ["SAMPLE"],
        memo: "test memo",
        isTestUser: true,
      });
    });

    it("should convert Firestore document to User", () => {
      const now = Timestamp.now();
      const mockData = {
        id: "123456",
        username: "John Doe",
        passwordHash: "hashed_password",
        createdAt: now,
        lastLoginAt: now,
        participatingGames: ["AAAAAA", "BBBBBB"],
        gameHistory: ["SAMPLE"],
        memo: "test memo",
        isTestUser: true,
      };

      // Mock DocumentSnapshot
      const mockSnapshot = {
        data: vi.fn(() => mockData),
      };

      const user = userConverter.fromFirestore(
        mockSnapshot as MockSnapshot,
        {},
      );

      expect(user).toEqual({
        id: "123456",
        username: "John Doe",
        passwordHash: "hashed_password",
        createdAt: now,
        lastLoginAt: now,
        participatingGames: ["AAAAAA", "BBBBBB"],
        gameHistory: ["SAMPLE"],
        memo: "test memo",
        isTestUser: true,
      });
    });

    it("should throw error when document data is undefined", () => {
      // Mock DocumentSnapshot with undefined data
      const mockSnapshot = {
        data: vi.fn(() => undefined),
      };

      expect(() => {
        userConverter.fromFirestore(mockSnapshot as MockSnapshot, {});
      }).toThrow("Document data is undefined");
    });
  });
});
