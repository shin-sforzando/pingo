import { describe, expect, it, vi } from "vitest";
import {
  isFirestoreTimestamp,
  toDate,
  toFirestoreTimestamp,
} from "./firestore";

// Mock the Firebase Timestamp classes
vi.mock("firebase-admin/firestore", () => {
  class MockTimestamp {
    seconds: number;
    nanoseconds: number;

    constructor(seconds: number, nanoseconds: number) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }

    toDate() {
      return new Date("2024-01-01T00:00:00Z");
    }

    static fromDate() {
      return new MockTimestamp(1704067200, 0);
    }
  }

  return {
    Timestamp: MockTimestamp,
  };
});

vi.mock("firebase/firestore", () => {
  class MockTimestamp {
    seconds: number;
    nanoseconds: number;

    constructor(seconds: number, nanoseconds: number) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }

    toDate() {
      return new Date("2024-01-01T00:00:00Z");
    }

    static fromDate() {
      return new MockTimestamp(1704067200, 0);
    }
  }

  return {
    Timestamp: MockTimestamp,
  };
});

// Import after mocks are set up
const { Timestamp: FirestoreAdminTimestamp } = await import(
  "firebase-admin/firestore"
);
const { Timestamp: FirestoreClientTimestamp } = await import(
  "firebase/firestore"
);

describe("Firestore Utilities", () => {
  describe("toDate", () => {
    it("should return the input if it's already a Date", () => {
      const date = new Date("2024-01-01T00:00:00Z");
      const result = toDate(date);
      expect(result).toBe(date);
    });

    it("should convert a Firestore Client Timestamp to a Date", () => {
      const timestamp = new FirestoreClientTimestamp(1704067200, 0);
      const result = toDate(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe("2024-01-01T00:00:00.000Z");
    });

    it("should convert a Firestore Admin Timestamp to a Date", () => {
      const timestamp = new FirestoreAdminTimestamp(1704067200, 0);
      const result = toDate(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe("2024-01-01T00:00:00.000Z");
    });

    it("should convert a plain object with seconds and nanoseconds to a Date", () => {
      const timestampObj = { seconds: 1704067200, nanoseconds: 0 };
      const result = toDate(timestampObj);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe("2024-01-01T00:00:00.000Z");
    });

    it("should throw an error for invalid input", () => {
      expect(() => toDate("not a timestamp")).toThrow();
      expect(() => toDate(123)).toThrow();
      expect(() => toDate(null)).toThrow();
      expect(() => toDate(undefined)).toThrow();
      expect(() => toDate({ seconds: "1704067200", nanoseconds: 0 })).toThrow();
      expect(() => toDate({ seconds: 1704067200 })).toThrow();
    });
  });

  describe("toFirestoreTimestamp", () => {
    it("should convert a Date to a Firestore Timestamp", () => {
      const date = new Date("2024-01-01T00:00:00Z");
      const result = toFirestoreTimestamp(date);

      // Check the result has the expected structure
      expect(result).toEqual(
        expect.objectContaining({
          seconds: 1704067200,
          nanoseconds: 0,
        }),
      );
    });

    it("should throw an error for invalid Date input", () => {
      const invalidDate = new Date("invalid date");
      expect(() => toFirestoreTimestamp(invalidDate)).toThrow();
    });
  });

  describe("isFirestoreTimestamp", () => {
    it("should return true for Firestore Client Timestamp instances", () => {
      const timestamp = new FirestoreClientTimestamp(1704067200, 0);
      expect(isFirestoreTimestamp(timestamp)).toBe(true);
    });

    it("should return true for Firestore Admin Timestamp instances", () => {
      const timestamp = new FirestoreAdminTimestamp(1704067200, 0);
      expect(isFirestoreTimestamp(timestamp)).toBe(true);
    });

    it("should return false for Date objects", () => {
      const date = new Date();
      expect(isFirestoreTimestamp(date)).toBe(false);
    });

    it("should return false for plain objects with seconds and nanoseconds", () => {
      const obj = { seconds: 1704067200, nanoseconds: 0 };
      expect(isFirestoreTimestamp(obj)).toBe(false);
    });

    it("should return false for other types", () => {
      expect(isFirestoreTimestamp("string")).toBe(false);
      expect(isFirestoreTimestamp(123)).toBe(false);
      expect(isFirestoreTimestamp(null)).toBe(false);
      expect(isFirestoreTimestamp(undefined)).toBe(false);
      expect(isFirestoreTimestamp({})).toBe(false);
    });
  });
});
