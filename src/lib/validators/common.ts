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

export const timestampSchema = z.date();

export type Timestamp = z.infer<typeof timestampSchema>;

export const firestoreTimestampSchema = z.object({
  seconds: z.number().int(),
  nanoseconds: z.number().int().gte(0).lt(1_000_000_000),
});

export const dateOrFirestoreTimestampSchema = z.union([
  timestampSchema,
  firestoreTimestampSchema,
]);

/**
 * Represents a Firebase Authentication UID.
 * According to Firebase documentation, UIDs are between 1-128 characters.
 * https://firebase.google.com/docs/auth/admin/manage-users
 */
export const userIdSchema = z
  .string()
  .min(1, { message: "User ID cannot be empty." })
  .max(128, { message: "User ID cannot exceed 128 characters." });

export type UserId = z.infer<typeof userIdSchema>;
