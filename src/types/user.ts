/**
 * User related type definitions and conversion functions
 */
import type { NotificationDisplayType, NotificationType } from "./common";
import type { TimestampInterface } from "./firestore";
import { dateToTimestamp, timestampToDate } from "./firestore";
import type { Notification, User } from "./schema";

/**
 * User document as stored in Firestore
 */
export interface UserDocument {
  id: string; // ULID
  username: string;
  passwordHash: string;
  createdAt: TimestampInterface;
  updatedAt?: TimestampInterface | null;
  lastLoginAt: TimestampInterface | null;
  participatingGames: string[]; // Array of game IDs, max 5
  gameHistory: string[]; // Array of past game IDs
  memo?: string; // Admin notes, not visible to users
  isTestUser: boolean;
}

/**
 * Notification document as stored in Firestore
 */
export interface NotificationDocument {
  id: string; // ULID
  type: NotificationType;
  displayType: NotificationDisplayType;
  message: string;
  createdAt: TimestampInterface;
  updatedAt?: TimestampInterface | null;
  read: boolean;
  relatedGameId?: string;
  details?: Record<string, unknown>;
}

/**
 * Convert a Firestore user document to a user model
 */
export function userFromFirestore(doc: UserDocument): User {
  return {
    id: doc.id,
    username: doc.username,
    createdAt: timestampToDate(doc.createdAt) as Date,
    updatedAt: timestampToDate(doc.updatedAt),
    lastLoginAt: timestampToDate(doc.lastLoginAt),
    participatingGames: doc.participatingGames,
    gameHistory: doc.gameHistory,
    memo: doc.memo,
    isTestUser: doc.isTestUser,
  };
}

/**
 * Convert a user model to a Firestore document
 */
export function userToFirestore(user: User, passwordHash = ""): UserDocument {
  // Create base document without optional fields
  const doc: Omit<UserDocument, "memo"> = {
    id: user.id,
    username: user.username,
    passwordHash: passwordHash, // Only used when creating a new user
    createdAt: dateToTimestamp(user.createdAt) as TimestampInterface,
    updatedAt: user.updatedAt
      ? (dateToTimestamp(user.updatedAt) as TimestampInterface)
      : null,
    lastLoginAt: user.lastLoginAt
      ? (dateToTimestamp(user.lastLoginAt) as TimestampInterface)
      : null,
    participatingGames: user.participatingGames,
    gameHistory: user.gameHistory,
    isTestUser: user.isTestUser,
  };

  // Add optional memo field if it exists (not undefined)
  return {
    ...doc,
    ...(user.memo !== undefined && { memo: user.memo }),
  } as UserDocument;
}

/**
 * Convert a Firestore notification document to a notification model
 */
export function notificationFromFirestore(
  doc: NotificationDocument,
): Notification {
  return {
    id: doc.id,
    type: doc.type as NotificationType,
    displayType: doc.displayType as NotificationDisplayType,
    message: doc.message,
    createdAt: timestampToDate(doc.createdAt) as Date,
    updatedAt: timestampToDate(doc.updatedAt),
    read: doc.read,
    relatedGameId: doc.relatedGameId,
    details: doc.details,
  };
}

/**
 * Convert a notification model to a Firestore document
 */
export function notificationToFirestore(
  notification: Notification,
): NotificationDocument {
  // Create base document without optional fields
  const doc: Omit<NotificationDocument, "relatedGameId" | "details"> = {
    id: notification.id,
    type: notification.type,
    displayType: notification.displayType,
    message: notification.message,
    createdAt: dateToTimestamp(notification.createdAt) as TimestampInterface,
    updatedAt: notification.updatedAt
      ? (dateToTimestamp(notification.updatedAt) as TimestampInterface)
      : null,
    read: notification.read,
  };

  // Add optional fields if they exist
  return {
    ...doc,
    ...(notification.relatedGameId && {
      relatedGameId: notification.relatedGameId,
    }),
    ...(notification.details && { details: notification.details }),
  } as NotificationDocument;
}
