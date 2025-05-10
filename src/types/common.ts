/**
 * Common type definitions used across the application
 */

/**
 * Role type for game participants
 */
export enum Role {
  CREATOR = "creator",
  ADMIN = "admin",
  PARTICIPANT = "participant",
}

/**
 * Game status
 */
export enum GameStatus {
  ACTIVE = "active",
  ENDED = "ended",
}

/**
 * Image processing status
 */
export enum ProcessingStatus {
  UPLOADED = "uploaded",
  CONTENT_CHECKING = "content_checking",
  ANALYZING = "analyzing",
  ANALYZED = "analyzed",
  ERROR = "error",
}

/**
 * Image acceptance status
 */
export enum AcceptanceStatus {
  ACCEPTED = "accepted",
  INAPPROPRIATE_CONTENT = "inappropriate_content",
  NO_MATCH = "no_match",
}

/**
 * Notification type
 */
export enum NotificationType {
  // System notifications
  SYSTEM_NOTIFICATION = "system_notification",

  // Authentication notifications
  ACCOUNT_REGISTERED = "account_registered",
  LOGIN = "login",
  LOGOUT = "logout",

  // Game invitations and status
  GAME_INVITATION = "game_invitation",
  GAME_STARTED = "game_started",
  GAME_ENDED = "game_ended",

  // Bingo achievements
  PLAYER_ACHIEVED_BINGO = "player_achieved_bingo",
  PLAYER_COMPLETED_GAME = "player_completed_game",
  SOMEONE_ACHIEVED_BINGO = "someone_achieved_bingo",
  SOMEONE_COMPLETED_GAME = "someone_completed_game",

  // Submission related
  NEW_SUBMISSION = "new_submission",
  SUBMISSION_ACCEPTED = "submission_accepted",
  SUBMISSION_REJECTED = "submission_rejected",
}

/**
 * Notification display type
 */
export enum NotificationDisplayType {
  TOAST = "toast",
  POPUP = "popup",
}

/**
 * Bingo line type
 */
export enum LineType {
  ROW = "row",
  COLUMN = "column",
  DIAGONAL = "diagonal",
}

/**
 * Bingo line information
 */
export interface CompletedLine {
  type: LineType;
  index: number;
  completedAt: Date;
}

/**
 * Cell position in the bingo board
 */
export interface CellPosition {
  x: number;
  y: number;
}

/**
 * API response structure
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
