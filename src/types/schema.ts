/**
 * Zod schemas for validation
 */
import { z } from "zod";
import {
  AcceptanceStatus,
  GameStatus,
  LineType,
  NotificationDisplayType,
  NotificationType,
  ProcessingStatus,
  Role,
} from "./common";

/**
 * Base schema with timestamp fields
 */
export const baseSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date().nullable().optional(),
});

/**
 * User schema
 */
export const userSchema = baseSchema.extend({
  id: z.string().ulid(), // ULID
  username: z
    .string()
    .min(3, { message: "Auth.errors.usernameTooShort" })
    .max(20, { message: "Auth.errors.usernameTooLong" }),
  lastLoginAt: z.date().nullable(),
  participatingGames: z.array(z.string()).max(5),
  gameHistory: z.array(z.string()),
  memo: z.string().optional(),
  isTestUser: z.boolean().default(false),
});

/**
 * User creation schema
 */
export const userCreationSchema = z.object({
  username: z
    .string()
    .min(1, { message: "Auth.errors.usernameRequired" })
    .min(3, { message: "Auth.errors.usernameTooShort" })
    .max(20, { message: "Auth.errors.usernameTooLong" }),
  password: z
    .string()
    .min(1, { message: "Auth.errors.passwordRequired" })
    .min(8, { message: "Auth.errors.passwordTooShort" })
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]+$/, {
      message: "Auth.errors.passwordInvalid",
    }),
  isTestUser: z.boolean(),
});

/**
 * User login schema
 */
export const userLoginSchema = z.object({
  username: z.string().min(1, { message: "Auth.errors.usernameRequired" }),
  password: z.string().min(1, { message: "Auth.errors.passwordRequired" }),
});

/**
 * Notification schema
 */
export const notificationSchema = baseSchema.extend({
  id: z.string().ulid(), // ULID
  type: z.nativeEnum(NotificationType),
  displayType: z.nativeEnum(NotificationDisplayType),
  message: z.string(),
  read: z.boolean().default(false),
  relatedGameId: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});

/**
 * Game participation schema
 */
export const gameParticipationSchema = baseSchema.extend({
  userId: z.string().ulid(),
  gameId: z.string(),
  role: z.nativeEnum(Role),
  joinedAt: z.date(),
  completedLines: z.number().int().min(0).max(12),
  lastCompletedAt: z.date().nullable(),
  submissionCount: z.number().int().min(0).max(30),
});

/**
 * Cell schema
 */
export const cellSchema = z.object({
  id: z.string(),
  position: z.object({
    x: z.number().int().min(0).max(4),
    y: z.number().int().min(0).max(4),
  }),
  subject: z.string(),
  isFree: z.boolean().default(false),
});

/**
 * Cell state schema
 */
export const cellStateSchema = z.object({
  isOpen: z.boolean().default(false),
  openedAt: z.date().nullable(),
  openedBySubmissionId: z.string().nullable(),
});

/**
 * Completed line schema
 */
export const completedLineSchema = z.object({
  type: z.nativeEnum(LineType),
  index: z.number().int().min(0).max(4),
  completedAt: z.date(),
});

/**
 * Player board schema
 */
export const playerBoardSchema = z.object({
  userId: z.string().ulid(),
  cellStates: z.record(cellStateSchema),
  completedLines: z.array(completedLineSchema),
});

/**
 * Game board schema
 */
export const gameBoardSchema = z.object({
  cells: z.array(cellSchema),
});

/**
 * Game schema
 */
export const gameSchema = baseSchema.extend({
  id: z.string().regex(/^[A-Z0-9]{6}$/),
  title: z.string().min(1).max(50),
  theme: z.string().min(1).max(50),
  creatorId: z.string().ulid(),
  expiresAt: z.date(),
  isPublic: z.boolean().default(false),
  isPhotoSharingEnabled: z.boolean().default(true),
  requiredBingoLines: z.number().int().min(1).max(5).default(1),
  confidenceThreshold: z.number().min(0).max(1).default(0.5),
  notes: z.string().optional(),
  status: z.nativeEnum(GameStatus).default(GameStatus.ACTIVE),
});

/**
 * Game creation schema
 */
export const gameCreationSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Game.errors.titleRequired" })
    .max(50, { message: "Game.errors.titleTooLong" }),
  theme: z
    .string()
    .min(1, { message: "Game.errors.themeRequired" })
    .max(50, { message: "Game.errors.themeTooLong" }),
  expiresAt: z
    .date()
    .min(new Date(), { message: "Game.errors.expiresAtInvalid" }),
  isPublic: z.boolean().default(false),
  isPhotoSharingEnabled: z.boolean().default(true),
  requiredBingoLines: z.number().int().min(1).max(5).default(1),
  confidenceThreshold: z.number().min(0).max(1).default(0.5),
  notes: z.string().optional(),
});

/**
 * Submission schema
 */
export const submissionSchema = baseSchema.extend({
  id: z.string().ulid(), // ULID
  userId: z.string().ulid(),
  imageUrl: z.string().url(),
  submittedAt: z.date(),
  analyzedAt: z.date().nullable(),
  aiResponse: z.string().nullable(),
  matchedCellId: z.string().nullable(),
  confidence: z.number().min(0).max(1).nullable(),
  processingStatus: z.nativeEnum(ProcessingStatus),
  acceptanceStatus: z.nativeEnum(AcceptanceStatus).nullable(),
  errorMessage: z.string().nullable(),
});

/**
 * Event schema
 */
export const eventSchema = baseSchema.extend({
  id: z.string().ulid(), // ULID
  type: z.string(),
  userId: z.string().ulid(),
  timestamp: z.date(),
  details: z.record(z.unknown()).optional(),
});

// Export types derived from schemas
export type User = z.infer<typeof userSchema>;
export type UserCreationData = z.infer<typeof userCreationSchema>;
export type UserLoginData = z.infer<typeof userLoginSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type GameParticipation = z.infer<typeof gameParticipationSchema>;
export type Cell = z.infer<typeof cellSchema>;
export type CellState = z.infer<typeof cellStateSchema>;
export type CompletedLine = z.infer<typeof completedLineSchema>;
export type PlayerBoard = z.infer<typeof playerBoardSchema>;
export type GameBoard = z.infer<typeof gameBoardSchema>;
export type Game = z.infer<typeof gameSchema>;
export type GameCreationData = z.infer<typeof gameCreationSchema>;
export type Submission = z.infer<typeof submissionSchema>;
export type Event = z.infer<typeof eventSchema>;
