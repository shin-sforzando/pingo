/**
 * Type definitions index file
 * Re-exports all types from the types directory
 */

// Firestore related types
export * from "./firestore";

// Common types - enums and basic interfaces
export {
  AcceptanceStatus,
  GameStatus,
  LineType,
  NotificationDisplayType,
  NotificationType,
  ProcessingStatus,
  Role,
} from "./common";

// Common interfaces
export type { ApiResponse, CellPosition, CompletedLine } from "./common";

// Schema definitions - Zod schemas and inferred types
export * from "./schema";

// User related types - Firestore document interfaces and conversion functions
export * from "./user";

// Game related types - Firestore document interfaces and conversion functions
export * from "./game";
