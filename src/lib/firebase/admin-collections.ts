/**
 * Admin SDK data access layer with type safety
 * Provides consistent data access patterns for server-side operations
 */
import { dateToTimestamp } from "../../types/firestore";
import {
  type EventDocument,
  type GameBoardDocument,
  type GameDocument,
  type GameParticipationDocument,
  type PlayerBoardDocument,
  type SubmissionDocument,
  eventFromFirestore,
  eventToFirestore,
  gameBoardFromFirestore,
  gameFromFirestore,
  gameParticipationFromFirestore,
  gameToFirestore,
  playerBoardFromFirestore,
  playerBoardToFirestore,
  submissionFromFirestore,
  submissionToFirestore,
} from "../../types/game";
import type {
  Event,
  Game,
  GameBoard,
  GameParticipation,
  PlayerBoard,
  Submission,
  User,
} from "../../types/schema";
import {
  type UserDocument,
  userFromFirestore,
  userToFirestore,
} from "../../types/user";
import { adminFirestore } from "./admin";

/**
 * Admin service for Game operations
 */
export namespace AdminGameService {
  /**
   * Get a game by ID
   */
  export async function getGame(gameId: string): Promise<Game | null> {
    const doc = await adminFirestore.collection("games").doc(gameId).get();

    if (!doc.exists) return null;
    return gameFromFirestore(doc.data() as GameDocument);
  }

  /**
   * Check if a game exists
   */
  export async function gameExists(gameId: string): Promise<boolean> {
    const doc = await adminFirestore.collection("games").doc(gameId).get();
    return doc.exists;
  }

  /**
   * Update a game
   */
  export async function updateGame(gameId: string, game: Game): Promise<void> {
    const docData = gameToFirestore(game);
    await adminFirestore
      .collection("games")
      .doc(gameId)
      .set(docData, { merge: true });
  }
}

/**
 * Admin service for Game Participation operations
 */
export namespace AdminGameParticipationService {
  /**
   * Get participant info for a specific game
   */
  export async function getParticipant(
    gameId: string,
    userId: string,
  ): Promise<GameParticipation | null> {
    const doc = await adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("participants")
      .doc(userId)
      .get();

    if (!doc.exists) return null;
    return gameParticipationFromFirestore(
      doc.data() as GameParticipationDocument,
    );
  }

  /**
   * Check if user is participant in a game
   */
  export async function isParticipant(
    gameId: string,
    userId: string,
  ): Promise<boolean> {
    const doc = await adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("participants")
      .doc(userId)
      .get();

    return doc.exists;
  }

  /**
   * Check if user is admin or creator of a game
   */
  export async function isGameAdmin(
    gameId: string,
    userId: string,
  ): Promise<boolean> {
    const snapshot = await adminFirestore
      .collection("game_participations")
      .where("userId", "==", userId)
      .where("gameId", "==", gameId)
      .where("role", "in", ["creator", "admin"])
      .get();

    return !snapshot.empty;
  }

  /**
   * Get all participants for a game
   */
  export async function getParticipants(
    gameId: string,
  ): Promise<Array<{ id: string; username: string }>> {
    const participantsSnapshot = await adminFirestore
      .collection(`games/${gameId}/participants`)
      .get();

    if (participantsSnapshot.empty) {
      return [];
    }

    // Get all participant user IDs
    const userIds = participantsSnapshot.docs.map((doc) => doc.id);

    // Fetch user data for each participant
    const participants = await Promise.all(
      userIds.map(async (userId) => {
        const userDoc = await adminFirestore
          .collection("users")
          .doc(userId)
          .get();

        if (!userDoc.exists || !userDoc.data()) {
          return {
            id: userId,
            username: "Unknown User",
          };
        }

        const userData = userDoc.data() as UserDocument;
        const user = userFromFirestore({
          ...userData,
          id: userId,
        });

        return {
          id: userId,
          username: user.username,
        };
      }),
    );

    // Sort by username
    return participants.sort((a, b) => a.username.localeCompare(b.username));
  }

  /**
   * Get current submission count for a user in a game
   */
  export async function getSubmissionCount(
    gameId: string,
    userId: string,
  ): Promise<number> {
    const snapshot = await adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("submissions")
      .where("userId", "==", userId)
      .get();

    return snapshot.size;
  }
}

/**
 * Admin service for Submission operations
 */
export namespace AdminSubmissionService {
  /**
   * Get a submission by ID
   */
  export async function getSubmission(
    gameId: string,
    submissionId: string,
  ): Promise<Submission | null> {
    const doc = await adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("submissions")
      .doc(submissionId)
      .get();

    if (!doc.exists) return null;
    return submissionFromFirestore(doc.data() as SubmissionDocument);
  }

  /**
   * Create a new submission
   */
  export async function createSubmission(
    gameId: string,
    submission: Submission,
  ): Promise<void> {
    const docData = submissionToFirestore(submission);
    await adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("submissions")
      .doc(submission.id)
      .set(docData);
  }

  /**
   * Update a submission
   */
  export async function updateSubmission(
    gameId: string,
    submissionId: string,
    submission: Submission,
  ): Promise<void> {
    const docData = submissionToFirestore(submission);
    await adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("submissions")
      .doc(submissionId)
      .set(docData, { merge: true });
  }

  /**
   * Get submissions for a game with optional filtering and pagination
   */
  export async function getSubmissions(
    gameId: string,
    options: {
      userId?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<Submission[]> {
    const { userId, limit = 50, offset = 0 } = options;

    // Build query - avoid complex composite index requirements
    const collection = adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("submissions");

    // Build query with proper ordering (now possible with composite index)
    let query = collection.orderBy("submittedAt", "desc");

    // Filter by user if specified (uses composite index: userId ASC, submittedAt DESC)
    if (userId) {
      query = collection
        .where("userId", "==", userId)
        .orderBy("submittedAt", "desc");
    }

    // Apply pagination
    if (0 < offset) {
      const offsetSnapshot = await query.limit(offset).get();
      if (offsetSnapshot.empty) {
        return [];
      }
      const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.limit(limit).get();

    // Convert to Submission objects
    const submissions: Submission[] = [];
    for (const doc of snapshot.docs) {
      const submissionData = doc.data() as SubmissionDocument;
      submissions.push(submissionFromFirestore(submissionData));
    }

    return submissions;
  }

  /**
   * Check if submission exists
   */
  export async function submissionExists(
    gameId: string,
    submissionId: string,
  ): Promise<boolean> {
    const doc = await adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("submissions")
      .doc(submissionId)
      .get();

    return doc.exists;
  }
}

/**
 * Admin service for PlayerBoard operations
 */
export namespace AdminPlayerBoardService {
  /**
   * Get a player board by game ID and user ID
   */
  export async function getPlayerBoard(
    gameId: string,
    userId: string,
  ): Promise<PlayerBoard | null> {
    const doc = await adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("playerBoards")
      .doc(userId)
      .get();

    if (!doc.exists) return null;
    return playerBoardFromFirestore(doc.data() as PlayerBoardDocument);
  }

  /**
   * Update a player board
   */
  export async function updatePlayerBoard(
    gameId: string,
    userId: string,
    playerBoard: PlayerBoard,
  ): Promise<void> {
    const docData = playerBoardToFirestore(playerBoard);
    await adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("playerBoards")
      .doc(userId)
      .set(docData, { merge: true });
  }

  /**
   * Check if player board exists
   */
  export async function playerBoardExists(
    gameId: string,
    userId: string,
  ): Promise<boolean> {
    const doc = await adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("playerBoards")
      .doc(userId)
      .get();

    return doc.exists;
  }
}

/**
 * Admin service for Event operations
 */
export namespace AdminEventService {
  /**
   * Get events for a game with optional filtering and pagination
   */
  export async function getEvents(
    gameId: string,
    options: {
      eventType?: string;
      userId?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<Event[]> {
    const { eventType, userId, limit = 50, offset = 0 } = options;

    // Build query
    let query = adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("events")
      .orderBy("timestamp", "desc");

    // Filter by event type if specified
    if (eventType) {
      query = query.where("type", "==", eventType);
    }

    // Filter by user if specified
    if (userId) {
      query = query.where("userId", "==", userId);
    }

    // Apply pagination
    if (0 < offset) {
      const offsetSnapshot = await query.limit(offset).get();
      if (offsetSnapshot.empty) {
        return [];
      }
      const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
      query = query.startAfter(lastDoc);
    }

    query = query.limit(limit);

    // Execute query
    const snapshot = await query.get();

    // Convert to Event objects
    const events: Event[] = [];
    for (const doc of snapshot.docs) {
      const eventData = doc.data() as EventDocument;
      events.push(eventFromFirestore(eventData));
    }

    return events;
  }

  /**
   * Create a new event
   */
  export async function createEvent(
    gameId: string,
    event: Event,
  ): Promise<void> {
    const docData = eventToFirestore(event);
    await adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("events")
      .doc(event.id)
      .set(docData);
  }
}

/**
 * Admin service for GameBoard operations
 */
export namespace AdminGameBoardService {
  /**
   * Get a game board by game ID
   */
  export async function getGameBoard(
    gameId: string,
  ): Promise<GameBoard | null> {
    const doc = await adminFirestore
      .collection(`games/${gameId}/board`)
      .doc("board")
      .get();

    if (!doc.exists) return null;
    return gameBoardFromFirestore(doc.data() as GameBoardDocument);
  }

  /**
   * Check if game board exists
   */
  export async function gameBoardExists(gameId: string): Promise<boolean> {
    const doc = await adminFirestore
      .collection(`games/${gameId}/board`)
      .doc("board")
      .get();

    return doc.exists;
  }
}

/**
 * Admin service for User operations
 */
export namespace AdminUserService {
  /**
   * Get a user by ID
   */
  export async function getUser(userId: string): Promise<User | null> {
    const doc = await adminFirestore.collection("users").doc(userId).get();

    if (!doc.exists) return null;
    return userFromFirestore(doc.data() as UserDocument);
  }

  /**
   * Get a user by username
   */
  export async function getUserByUsername(
    username: string,
  ): Promise<User | null> {
    const snapshot = await adminFirestore
      .collection("users")
      .where("username", "==", username)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return userFromFirestore(doc.data() as UserDocument);
  }

  /**
   * Get a user document by username for authentication (includes passwordHash)
   */
  export async function getUserDocumentByUsername(
    username: string,
  ): Promise<UserDocument | null> {
    const snapshot = await adminFirestore
      .collection("users")
      .where("username", "==", username)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return doc.data() as UserDocument;
  }

  /**
   * Get a user document by ID for authentication (includes passwordHash)
   */
  export async function getUserDocumentById(
    userId: string,
  ): Promise<UserDocument | null> {
    const doc = await adminFirestore.collection("users").doc(userId).get();

    if (!doc.exists) return null;
    return doc.data() as UserDocument;
  }

  /**
   * Create a new user
   */
  export async function createUser(
    user: User,
    passwordHash?: string,
  ): Promise<void> {
    const docData = userToFirestore(user, passwordHash);
    await adminFirestore.collection("users").doc(user.id).set(docData);
  }

  /**
   * Update a user
   */
  export async function updateUser(userId: string, user: User): Promise<void> {
    const docData = userToFirestore(user);
    await adminFirestore
      .collection("users")
      .doc(userId)
      .set(docData, { merge: true });
  }

  /**
   * Check if a user exists
   */
  export async function userExists(userId: string): Promise<boolean> {
    const doc = await adminFirestore.collection("users").doc(userId).get();
    return doc.exists;
  }

  /**
   * Check if a username is taken
   */
  export async function isUsernameTaken(username: string): Promise<boolean> {
    const snapshot = await adminFirestore
      .collection("users")
      .where("username", "==", username)
      .limit(1)
      .get();

    return !snapshot.empty;
  }

  /**
   * Update user's last login time
   */
  export async function updateLastLogin(userId: string): Promise<void> {
    const now = new Date();
    const timestamp = dateToTimestamp(now);
    await adminFirestore.collection("users").doc(userId).update({
      lastLoginAt: timestamp,
      updatedAt: timestamp,
    });
  }

  /**
   * Update user with partial data
   */
  export async function updateUserPartial(
    userId: string,
    updates: Record<string, unknown>,
  ): Promise<void> {
    await adminFirestore.collection("users").doc(userId).update(updates);
  }
}

/**
 * Batch operations for improved performance
 */
export namespace AdminBatchService {
  /**
   * Get game, participant, and submission data in parallel
   * Optimizes the common pattern used in submission APIs
   */
  export async function getGameSubmissionContext(
    gameId: string,
    userId: string,
    submissionId: string,
  ): Promise<{
    game: Game | null;
    isParticipant: boolean;
    submission: Submission | null;
  }> {
    const [gameDoc, participantDoc, submissionDoc] = await Promise.all([
      adminFirestore.collection("games").doc(gameId).get(),
      adminFirestore
        .collection("games")
        .doc(gameId)
        .collection("participants")
        .doc(userId)
        .get(),
      adminFirestore
        .collection("games")
        .doc(gameId)
        .collection("submissions")
        .doc(submissionId)
        .get(),
    ]);

    return {
      game: gameDoc.exists
        ? gameFromFirestore(gameDoc.data() as GameDocument)
        : null,
      isParticipant: participantDoc.exists,
      submission: submissionDoc.exists
        ? submissionFromFirestore(submissionDoc.data() as SubmissionDocument)
        : null,
    };
  }
}

/**
 * Transaction operations for atomic data consistency
 */
export namespace AdminTransactionService {
  /**
   * Atomically create submission and update player board
   * Ensures data consistency between submission creation and board updates
   */
  export async function createSubmissionAndUpdateBoard(
    gameId: string,
    submission: Submission,
    playerBoard: PlayerBoard,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await adminFirestore.runTransaction(async (transaction) => {
        const submissionRef = adminFirestore
          .collection("games")
          .doc(gameId)
          .collection("submissions")
          .doc(submission.id);

        const playerBoardRef = adminFirestore
          .collection("games")
          .doc(gameId)
          .collection("playerBoards")
          .doc(userId);

        // Check if submission already exists to prevent duplicates
        const existingSubmission = await transaction.get(submissionRef);
        if (existingSubmission.exists) {
          throw new Error("Submission already exists");
        }

        // Get current player board state to check for race conditions
        const currentPlayerBoardDoc = await transaction.get(playerBoardRef);
        let currentPlayerBoard: PlayerBoard;

        if (currentPlayerBoardDoc.exists) {
          currentPlayerBoard = playerBoardFromFirestore(
            currentPlayerBoardDoc.data() as PlayerBoardDocument,
          );
        } else {
          // Create new player board if it doesn't exist
          currentPlayerBoard = {
            userId,
            cellStates: {},
            completedLines: [],
          };
        }

        // Check if the cell is already open (race condition protection)
        if (
          submission.matchedCellId &&
          currentPlayerBoard.cellStates[submission.matchedCellId]?.isOpen
        ) {
          throw new Error("Cell is already open");
        }

        // Create submission
        const submissionData = submissionToFirestore(submission);
        transaction.set(submissionRef, submissionData);

        // Update player board if submission is accepted and has a matched cell
        if (
          submission.acceptanceStatus === "accepted" &&
          submission.matchedCellId
        ) {
          const updatedPlayerBoard = { ...playerBoard };
          const playerBoardData = playerBoardToFirestore(updatedPlayerBoard);
          transaction.set(playerBoardRef, playerBoardData, { merge: true });
        }
      });

      return { success: true };
    } catch (error) {
      console.error("Transaction failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create submission only (for cases where board update is not needed)
   */
  export async function createSubmissionOnly(
    gameId: string,
    submission: Submission,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await adminFirestore.runTransaction(async (transaction) => {
        const submissionRef = adminFirestore
          .collection("games")
          .doc(gameId)
          .collection("submissions")
          .doc(submission.id);

        // Check if submission already exists to prevent duplicates
        const existingSubmission = await transaction.get(submissionRef);
        if (existingSubmission.exists) {
          throw new Error("Submission already exists");
        }

        // Create submission
        const submissionData = submissionToFirestore(submission);
        transaction.set(submissionRef, submissionData);
      });

      return { success: true };
    } catch (error) {
      console.error("Transaction failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
