import { z } from "zod";
import { gameIdSchema, timestampSchema, ulidSchema } from "../common";

/**
 * Schema for a single cell on the bingo board.
 */
export const bingoCellSchema = z.object({
  // Internal identifier for the cell, could be a simple string like "0-0", "0-1", etc.
  // Needs to be unique within the board.
  id: z.string().min(1),
  // Position on the 5x5 grid.
  position: z.object({
    x: z.number().int().gte(0).lte(4),
    y: z.number().int().gte(0).lte(4),
  }),
  // The subject or target for this cell (e.g., "red car", "smiling person").
  subject: z.string().min(1).max(100),
  // Indicates if this is the central free cell. Typically position {x: 2, y: 2}.
  isFree: z.boolean().default(false),
});

export type BingoCell = z.infer<typeof bingoCellSchema>;

/**
 * Schema for the common game board template.
 * This is created once per game and shared by all players as the base structure.
 * Contains exactly 25 cells.
 */
export const boardSchema = z.object({
  // Array of 25 cells defining the board layout and subjects.
  cells: z.array(bingoCellSchema).length(25, {
    message: "Board must contain exactly 25 cells.",
  }),
});

export type Board = z.infer<typeof boardSchema>;

/**
 * Schema for the state of a single cell within a player's specific board.
 * Tracks whether a player has successfully marked off this cell.
 */
export const playerBoardCellStateSchema = z.object({
  // Whether the player has successfully opened this cell.
  isOpen: z.boolean().default(false),
  // Timestamp when the cell was opened. Null if not opened.
  openedAt: timestampSchema.nullable(),
  // The ID of the submission that resulted in this cell being opened. Null if not opened or opened freely (e.g., center cell).
  openedBySubmissionId: ulidSchema.nullable(),
});

export type PlayerBoardCellState = z.infer<typeof playerBoardCellStateSchema>;

/**
 * Schema representing a completed line (row, column, or diagonal) on a player's board.
 */
export const completedLineSchema = z.object({
  // Type of the completed line.
  type: z.enum(["row", "column", "diagonal"]),
  // Index of the row/column (0-4) or diagonal (0 for TL-BR, 1 for TR-BL).
  index: z.number().int().gte(0).lte(4),
  // Timestamp when the line was completed.
  completedAt: timestampSchema,
});

export type CompletedLine = z.infer<typeof completedLineSchema>;

/**
 * Schema for a player's individual bingo board state within a game.
 * Stored under the /games/{gameId}/playerBoards/{userId} path.
 * Tracks the progress of a specific player on the common board.
 */
export const playerBoardSchema = z.object({
  // The ID of the player this board belongs to.
  userId: z.string().min(1), // Corresponds to User ID (Firebase Auth UID)
  // Map where keys are cell IDs (from boardSchema.cells) and values are their states.
  // This allows tracking the open/closed status for each cell for this specific player.
  // Ensures all 25 cells from the board are represented.
  cellStates: z.record(bingoCellSchema.shape.id, playerBoardCellStateSchema),
  // Array recording the lines completed by this player.
  completedLines: z.array(completedLineSchema),
});

export type PlayerBoard = z.infer<typeof playerBoardSchema>;

/**
 * Schema for a participant entry within a game's participants sub-collection.
 * Stored under /games/{gameId}/participants/{userId}.
 * Contains summary information about a player's participation for quick lookups (e.g., leaderboards).
 */
export const participantSchema = z.object({
  // The ID of the participating user. Document ID is the userId.
  id: z.string().min(1), // Corresponds to User ID (Firebase Auth UID)
  // Timestamp when the user joined the game.
  joinedAt: timestampSchema,
  // Number of lines the participant has completed. Denormalized for quick access.
  completedLines: z.number().int().gte(0).default(0),
  // Timestamp of the last completed line. Null if no lines completed.
  lastCompletedAt: timestampSchema.nullable(),
  // Count of image submissions made by this participant. Max 30 as per spec.
  submissionCount: z.number().int().gte(0).lte(30).default(0),
});

export type Participant = z.infer<typeof participantSchema>;

/**
 * Schema for an image submission within a game.
 * Stored under /games/{gameId}/submissions/{submissionId}.
 */
export const submissionSchema = z.object({
  // Unique ID for the submission (ULID). Document ID is the submissionId.
  id: ulidSchema,
  // ID of the user who made the submission.
  userId: z.string().min(1), // Corresponds to User ID (Firebase Auth UID)
  // URL pointing to the image file in Cloud Storage.
  // Using z.string() as the exact format might vary (e.g., gs:// path or https:// URL).
  // Consider adding z.url() if only HTTPS URLs are expected after processing.
  imageUrl: z.string().min(1),
  // Timestamp when the image upload was completed by the client.
  submittedAt: timestampSchema,
  // Timestamp when the AI analysis process finished. Null if not yet analyzed.
  analyzedAt: timestampSchema.nullable(),
  // Raw response or summary from the AI analysis. Store as string for flexibility.
  // Could be JSON stringified if structured data is needed. Consider size limits.
  aiResponse: z.string().optional(),
  // The ID of the bingo cell the AI determined the image matches. Null if no match.
  matchedCellId: bingoCellSchema.shape.id.nullable(),
  // Confidence score from the AI analysis (0.0 to 1.0). Null if not analyzed or no match.
  confidence: z.number().gte(0).lte(1).nullable(),
  // Tracks the backend processing status of the submission.
  processingStatus: z.enum([
    "uploaded", // Client confirmed upload
    "content_checking", // Sent for moderation/safety check
    "analyzing", // Sent for AI subject analysis
    "analyzed", // Analysis complete
    "error", // An error occurred during processing
  ]),
  // Final acceptance status after processing and validation.
  acceptanceStatus: z
    .enum([
      "accepted", // Matched a cell above threshold, content appropriate
      "inappropriate_content", // Failed content moderation
      "no_match", // Analysis complete, but no cell matched sufficiently
    ])
    .nullable(), // Null until processing is complete
  // Optional message detailing any error that occurred during processing.
  errorMessage: z.string().optional(),
});

export type Submission = z.infer<typeof submissionSchema>;

/**
 * Schema for game events recorded within a game's events sub-collection.
 * Stored under /games/{gameId}/events/{eventId}. Useful for auditing or activity feeds.
 */
export const eventSchema = z.object({
  // Unique ID for the event (ULID). Document ID is the eventId.
  id: ulidSchema,
  // Type of the event that occurred.
  type: z.enum([
    "game_created",
    "player_joined",
    "player_left", // Consider adding if needed
    "submission_uploaded",
    "submission_processed", // Covers analyzed, accepted, rejected states
    "cell_opened",
    "line_completed",
    "game_completed_by_player",
    "game_ended_by_admin",
  ]),
  // ID of the user associated with the event (if applicable).
  userId: z.string().min(1).optional(), // Optional for system events like 'game_created'
  // Timestamp when the event occurred.
  timestamp: timestampSchema,
  // Flexible field for event-specific details.
  // Example: { submissionId: '...', matchedCellId: '...', confidence: 0.8 } for 'submission_processed'
  details: z.record(z.unknown()).optional(),
});

export type Event = z.infer<typeof eventSchema>;

/**
 * Schema for the main Game document in the 'games' collection.
 * Defines the structure and validation rules for game data. Document ID is the gameId.
 */
export const gameSchema = z.object({
  // Unique ID for the game (6 uppercase letters).
  id: gameIdSchema,
  // Title of the game.
  title: z.string().min(1).max(50),
  // Optional theme or location description for the game.
  theme: z.string().max(100).optional(),
  // User ID of the game creator.
  creatorId: z.string().min(1), // Corresponds to User ID (Firebase Auth UID)
  // Timestamp when the game was created.
  createdAt: timestampSchema,
  // Timestamp when the game automatically expires or ends.
  expiresAt: timestampSchema,
  // Whether the game is listed publicly.
  isPublic: z.boolean().default(false),
  // Whether photos submitted by players are visible to other players.
  isPhotoSharingEnabled: z.boolean().default(true),
  // Number of lines required to win/complete the game.
  requiredBingoLines: z.number().int().gte(1).lte(5),
  // AI confidence threshold (0.0 to 1.0) for accepting a match.
  confidenceThreshold: z.number().gte(0).lte(1).default(0.5),
  // Optional notes or description for the game.
  notes: z.string().max(500).optional(),
  // Current status of the game.
  status: z.enum(["active", "ended", "archived"]).default("active"),
  // The common board structure (embedded directly in the game document).
  // Defined separately for clarity but included here.
  board: boardSchema,
});

export type Game = z.infer<typeof gameSchema>;
