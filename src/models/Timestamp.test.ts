import { Timestamp } from "firebase/firestore";
import { describe, expect, it, vi } from "vitest";
import { timestampHelpers, timestampSchema } from "./Timestamp";

describe("Timestamp model", () => {
  // Timestamp schema testing
  describe("timestampSchema", () => {
    it("should validate a valid Timestamp", () => {
      const now = Timestamp.now();
      const result = timestampSchema.safeParse(now);
      expect(result.success).toBe(true);
    });

    it("should reject non-Timestamp values", () => {
      const date = new Date();
      const result = timestampSchema.safeParse(date);
      expect(result.success).toBe(false);
    });
  });

  // Timestamp helpers testing
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
});
