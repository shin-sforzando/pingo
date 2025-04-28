import { z } from "zod";

/**
 * Represents a unique identifier for a game session.
 * Must be exactly 6 uppercase English letters.
 * This specific format was chosen for brevity and ease of sharing (e.g., verbally).
 */
export const gameIdSchema = z
  .string()
  .length(6, { message: "Game ID must be exactly 6 characters long." })
  .regex(/^[A-Z]{6}$/, {
    message: "Game ID must consist of 6 uppercase English letters.",
  });

export type GameId = z.infer<typeof gameIdSchema>;

/**
 * Represents a Universally Unique Lexicographically Sortable Identifier (ULID).
 * Used for time-sortable unique IDs, primarily for database records like notifications or submissions.
 * Ensures uniqueness and allows efficient time-based sorting without complex indexing.
 * We use Crockford's Base32 alphabet (excludes I, L, O, U) for better human readability.
 */
export const ulidSchema = z
  .string()
  .length(26, { message: "ULID must be exactly 26 characters long." })
  .regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, {
    message: "ULID must be a valid 26-character Crockford Base32 string.",
  });

export type ULID = z.infer<typeof ulidSchema>;

/**
 * Represents a timestamp using the standard JavaScript Date object.
 * This is the primary representation used within the application logic.
 * Note: When interacting with Firestore, conversion to/from Firestore Timestamp objects
 * might be necessary. Use `firestoreTimestampSchema` and conversion utilities for that.
 */
export const timestampSchema = z.date();

export type Timestamp = z.infer<typeof timestampSchema>;

/**
 * Represents a Firestore Timestamp object structure.
 * This is used specifically when interacting directly with Firestore data
 * where Timestamps are represented as objects with seconds and nanoseconds.
 * Necessary for type safety when converting between JS Date and Firestore Timestamp.
 * See: https://firebase.google.com/docs/reference/js/firestore_.timestamp
 */
export const firestoreTimestampSchema = z.object({
  seconds: z.number().int(),
  nanoseconds: z.number().int().gte(0).lt(1_000_000_000),
});

export type FirestoreTimestamp = z.infer<typeof firestoreTimestampSchema>;

/**
 * Represents a value that can be either a standard JavaScript Date object
 * or a Firestore Timestamp object.
 * Useful for functions or components that might receive timestamp data
 * in either format before normalization or processing.
 */
export const dateOrFirestoreTimestampSchema = z.union([
  timestampSchema,
  firestoreTimestampSchema,
]);

export type DateOrFirestoreTimestamp = z.infer<
  typeof dateOrFirestoreTimestampSchema
>;
