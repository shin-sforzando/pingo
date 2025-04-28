import { describe, expect, it } from "vitest";
// Removed unused 'z' import
import {
  dateOrFirestoreTimestampSchema,
  firestoreTimestampSchema,
  gameIdSchema,
  timestampSchema,
  ulidSchema,
} from "./common";

describe("Common Zod Schemas", () => {
  // --- gameIdSchema Tests ---
  describe("gameIdSchema", () => {
    it("should validate correct 6-character uppercase IDs", () => {
      expect(gameIdSchema.safeParse("ABCDEF").success).toBe(true);
      expect(gameIdSchema.safeParse("XYZABC").success).toBe(true);
      expect(gameIdSchema.safeParse("QWERTY").success).toBe(true);
    });

    it("should invalidate incorrect length IDs", () => {
      expect(gameIdSchema.safeParse("ABCDE").success).toBe(false); // Too short
      expect(gameIdSchema.safeParse("ABCDEFG").success).toBe(false); // Too long
      expect(gameIdSchema.safeParse("").success).toBe(false); // Empty
    });

    it("should invalidate IDs with lowercase letters", () => {
      expect(gameIdSchema.safeParse("abcDEF").success).toBe(false);
      expect(gameIdSchema.safeParse("Abcdef").success).toBe(false);
    });

    it("should invalidate IDs with numbers or symbols", () => {
      expect(gameIdSchema.safeParse("ABCD12").success).toBe(false);
      expect(gameIdSchema.safeParse("ABC-EF").success).toBe(false);
      expect(gameIdSchema.safeParse("ABCDEF!").success).toBe(false);
    });
  });

  // --- ulidSchema Tests ---
  describe("ulidSchema", () => {
    // Example valid ULIDs (Crockford's Base32)
    const validUlid1 = "01HXZM6DRW8PXGZJ6Q1YJ8KNYT";
    const validUlid2 = "01BX5ZZKBKACTAV9WEVGEMMVS0";

    it("should validate correct 26-character ULIDs", () => {
      expect(ulidSchema.safeParse(validUlid1).success).toBe(true);
      expect(ulidSchema.safeParse(validUlid2).success).toBe(true);
    });

    it("should invalidate incorrect length ULIDs", () => {
      expect(ulidSchema.safeParse(validUlid1.slice(0, 25)).success).toBe(false); // Too short
      expect(ulidSchema.safeParse(`${validUlid1}A`).success).toBe(false); // Too long - Use template literal
      expect(ulidSchema.safeParse("").success).toBe(false); // Empty
    });

    it("should invalidate ULIDs with invalid characters (lowercase, I, L, O, U, symbols)", () => {
      expect(ulidSchema.safeParse("01hXZM6DRW8PXGZJ6Q1YJ8KNYT").success).toBe(
        false,
      ); // lowercase h
      expect(ulidSchema.safeParse("01IXZM6DRW8PXGZJ6Q1YJ8KNYT").success).toBe(
        false,
      ); // Invalid I
      expect(ulidSchema.safeParse("01LXZM6DRW8PXGZJ6Q1YJ8KNYT").success).toBe(
        false,
      ); // Invalid L
      expect(ulidSchema.safeParse("01OXZM6DRW8PXGZJ6Q1YJ8KNYT").success).toBe(
        false,
      ); // Invalid O
      expect(ulidSchema.safeParse("01UXZM6DRW8PXGZJ6Q1YJ8KNYT").success).toBe(
        false,
      ); // Invalid U
      expect(ulidSchema.safeParse("01-XZM6DRW8PXGZJ6Q1YJ8KNYT").success).toBe(
        false,
      ); // Symbol
    });
  });

  // --- timestampSchema Tests ---
  describe("timestampSchema (Date)", () => {
    it("should validate valid Date objects", () => {
      expect(timestampSchema.safeParse(new Date()).success).toBe(true);
      expect(
        timestampSchema.safeParse(new Date("2024-01-01T00:00:00Z")).success,
      ).toBe(true);
    });

    it("should invalidate non-Date objects", () => {
      expect(timestampSchema.safeParse("2024-01-01").success).toBe(false); // String
      expect(timestampSchema.safeParse(1704067200000).success).toBe(false); // Number
      expect(timestampSchema.safeParse(null).success).toBe(false);
      expect(timestampSchema.safeParse(undefined).success).toBe(false);
      expect(timestampSchema.safeParse({}).success).toBe(false);
    });

    it("should invalidate invalid Date objects", () => {
      expect(
        timestampSchema.safeParse(new Date("invalid date string")).success,
      ).toBe(false);
    });
  });

  // --- firestoreTimestampSchema Tests ---
  describe("firestoreTimestampSchema", () => {
    it("should validate valid Firestore timestamp objects", () => {
      expect(
        firestoreTimestampSchema.safeParse({
          seconds: 1678886400,
          nanoseconds: 123456789,
        }).success,
      ).toBe(true);
      expect(
        firestoreTimestampSchema.safeParse({ seconds: 0, nanoseconds: 0 })
          .success,
      ).toBe(true);
    });

    it("should invalidate objects with missing fields", () => {
      expect(
        firestoreTimestampSchema.safeParse({ seconds: 1678886400 }).success,
      ).toBe(false);
      expect(
        firestoreTimestampSchema.safeParse({ nanoseconds: 123456789 }).success,
      ).toBe(false);
    });

    it("should invalidate objects with incorrect types", () => {
      expect(
        firestoreTimestampSchema.safeParse({
          seconds: "1678886400",
          nanoseconds: 123,
        }).success,
      ).toBe(false);
      expect(
        firestoreTimestampSchema.safeParse({
          seconds: 1678886400,
          nanoseconds: "123",
        }).success,
      ).toBe(false);
    });

    it("should invalidate objects with out-of-range nanoseconds", () => {
      expect(
        firestoreTimestampSchema.safeParse({
          seconds: 1678886400,
          nanoseconds: -1,
        }).success,
      ).toBe(false);
      expect(
        firestoreTimestampSchema.safeParse({
          seconds: 1678886400,
          nanoseconds: 1_000_000_000,
        }).success,
      ).toBe(false);
    });
  });

  // --- dateOrFirestoreTimestampSchema Tests ---
  describe("dateOrFirestoreTimestampSchema", () => {
    it("should validate valid Date objects", () => {
      expect(dateOrFirestoreTimestampSchema.safeParse(new Date()).success).toBe(
        true,
      );
    });

    it("should validate valid Firestore timestamp objects", () => {
      expect(
        dateOrFirestoreTimestampSchema.safeParse({
          seconds: 1678886400,
          nanoseconds: 123456789,
        }).success,
      ).toBe(true);
    });

    it("should invalidate other types", () => {
      expect(dateOrFirestoreTimestampSchema.safeParse("string").success).toBe(
        false,
      );
      expect(dateOrFirestoreTimestampSchema.safeParse(12345).success).toBe(
        false,
      );
      expect(dateOrFirestoreTimestampSchema.safeParse(null).success).toBe(
        false,
      );
      expect(
        dateOrFirestoreTimestampSchema.safeParse({ sec: 1, nano: 1 }).success,
      ).toBe(false); // Incorrect field names
    });
  });
});
