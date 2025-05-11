import type { TimestampInterface } from "@/types/firestore";
import type { User } from "@/types/schema";
import type { UserDocument } from "@/types/user";
import { Timestamp } from "firebase-admin/firestore";

/**
 * Convert a Date to an admin Timestamp for tests
 */
export function dateToAdminTimestampForTest(
  date: Date | null | undefined,
): TimestampInterface | null {
  return date ? Timestamp.fromDate(date) : null;
}

/**
 * Convert a user model to a Firestore document for tests
 * This version ensures we use AdminTimestamp even in jsdom environment
 */
export function userToFirestoreForTest(
  user: User,
  passwordHash = "",
): UserDocument {
  // Create base document without optional fields
  const doc: Omit<UserDocument, "memo"> = {
    id: user.id,
    username: user.username,
    passwordHash: passwordHash, // Only used when creating a new user
    createdAt: dateToAdminTimestampForTest(
      user.createdAt,
    ) as TimestampInterface,
    updatedAt: user.updatedAt
      ? (dateToAdminTimestampForTest(user.updatedAt) as TimestampInterface)
      : null,
    lastLoginAt: user.lastLoginAt
      ? (dateToAdminTimestampForTest(user.lastLoginAt) as TimestampInterface)
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
