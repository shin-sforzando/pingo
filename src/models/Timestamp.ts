import { Timestamp } from "firebase/firestore";
import { z } from "zod";

/**
 * Timestamp validation schema for Zod
 */
export const timestampSchema = z.custom<Timestamp>(
  (val) => {
    return val instanceof Timestamp;
  },
  {
    message: "Expected a Firebase Timestamp",
  },
);

/**
 * Helper functions for working with Timestamps
 */
export const timestampHelpers = {
  /**
   * Create a Timestamp from a Date or string
   */
  fromDate: (date: Date | string): Timestamp => {
    if (typeof date === "string") {
      return Timestamp.fromDate(new Date(date));
    }
    return Timestamp.fromDate(date);
  },

  /**
   * Get current timestamp
   */
  now: (): Timestamp => {
    return Timestamp.now();
  },

  /**
   * Format timestamp for display
   */
  format: (timestamp: Timestamp): string => {
    return timestamp.toDate().toISOString();
  },
};
