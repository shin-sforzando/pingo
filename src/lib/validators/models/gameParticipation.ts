import { z } from "zod";
import { gameIdSchema, timestampSchema } from "../common";

/**
 * Schema for the GameParticipation document in the 'game_participations' collection.
 * This collection links users to the games they are involved in, defining their role and status.
 * It allows querying for all games a user is part of, or all users in a specific game.
 * The document ID is typically a composite key like `${userId}_${gameId}` for efficient lookups,
 * although a unique ID (like ULID) could also be used if preferred.
 * Assuming composite key for now, so no separate 'id' field in the schema itself.
 */
export const gameParticipationSchema = z.object({
  // ID of the user participating. Part of the composite document ID.
  userId: z.string().min(1), // Corresponds to User ID (Firebase Auth UID)
  // ID of the game being participated in. Part of the composite document ID.
  gameId: gameIdSchema,
  // Role of the user within this specific game. Determines permissions.
  role: z.enum(["creator", "admin", "participant"]),
  // Timestamp when the user joined the game.
  joinedAt: timestampSchema,
  // Denormalized count of completed lines for this user in this game.
  // Matches the value in /games/{gameId}/participants/{userId}.
  // Useful for quickly displaying progress without reading the participant sub-collection.
  completedLines: z.number().int().gte(0).default(0),
  // Denormalized timestamp of the last completed line.
  // Matches the value in /games/{gameId}/participants/{userId}. Null if none completed.
  lastCompletedAt: timestampSchema.nullable(),
  // Denormalized count of submissions for this user in this game.
  // Matches the value in /games/{gameId}/participants/{userId}. Max 30.
  submissionCount: z.number().int().gte(0).lte(30).default(0),
});

export type GameParticipation = z.infer<typeof gameParticipationSchema>;
