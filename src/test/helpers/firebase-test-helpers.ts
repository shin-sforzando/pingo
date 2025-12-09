import { Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
import type { TimestampInterface } from "@/types/firestore";
import type { User } from "@/types/schema";
import type { UserDocument } from "@/types/user";

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

/**
 * Create a test user with specified gameHistory for testing game limits
 * Returns the created user's uid and username
 */
export async function createTestUserWithGameHistory(
  gameHistory: string[],
  isTestUser = false,
): Promise<{ uid: string; username: string }> {
  // Generate unique username for test
  const username = `test_user_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Create Auth user
  const userRecord = await adminAuth.createUser({
    displayName: username,
  });

  // Create Firestore user document with gameHistory
  await adminFirestore.collection("users").doc(userRecord.uid).set({
    id: userRecord.uid,
    username,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
    participatingGames: [],
    gameHistory,
    isTestUser,
  });

  return { uid: userRecord.uid, username };
}

/**
 * Fill a game with specified number of participants for testing participant limits
 * Creates test users and adds them as participants to the game
 */
export async function fillGameWithParticipants(
  gameId: string,
  count: number,
): Promise<string[]> {
  const participantIds: string[] = [];

  for (let i = 0; i < count; i++) {
    // Create test user
    const participant = await createTestUserWithGameHistory([], true);
    participantIds.push(participant.uid);

    // Add participant to game
    await adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("participants")
      .doc(participant.uid)
      .set({
        userId: participant.uid,
        gameId,
        role: "participant",
        joinedAt: new Date(),
      });

    // Update user's participatingGames
    await adminFirestore
      .collection("users")
      .doc(participant.uid)
      .update({
        participatingGames: [gameId],
        gameHistory: [gameId],
      });
  }

  return participantIds;
}
