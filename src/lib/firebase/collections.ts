/**
 * Firestore collections with type converters
 */
import {
  type FirestoreDataConverter,
  collection,
  doc,
} from "firebase/firestore";
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
  gameBoardToFirestore,
  gameFromFirestore,
  gameParticipationFromFirestore,
  gameParticipationToFirestore,
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
  Notification,
  PlayerBoard,
  Submission,
  User,
} from "../../types/schema";
import {
  type NotificationDocument,
  type UserDocument,
  notificationFromFirestore,
  notificationToFirestore,
  userFromFirestore,
  userToFirestore,
} from "../../types/user";
import { firestore } from "./client";

/**
 * User converter for Firestore
 */
export const userConverter: FirestoreDataConverter<User> = {
  toFirestore: (user: User) => userToFirestore(user),
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options) as UserDocument;
    return userFromFirestore(data);
  },
};

/**
 * Notification converter for Firestore
 */
export const notificationConverter: FirestoreDataConverter<Notification> = {
  toFirestore: (notification: Notification) =>
    notificationToFirestore(notification),
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options) as NotificationDocument;
    return notificationFromFirestore(data);
  },
};

/**
 * Game converter for Firestore
 */
export const gameConverter: FirestoreDataConverter<Game> = {
  toFirestore: (game: Game) => gameToFirestore(game),
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options) as GameDocument;
    return gameFromFirestore(data);
  },
};

/**
 * Game board converter for Firestore
 */
export const gameBoardConverter: FirestoreDataConverter<GameBoard> = {
  toFirestore: (board: GameBoard) => gameBoardToFirestore(board),
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options) as GameBoardDocument;
    return gameBoardFromFirestore(data);
  },
};

/**
 * Player board converter for Firestore
 */
export const playerBoardConverter: FirestoreDataConverter<PlayerBoard> = {
  toFirestore: (board: PlayerBoard) => playerBoardToFirestore(board),
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options) as PlayerBoardDocument;
    return playerBoardFromFirestore(data);
  },
};

/**
 * Game participation converter for Firestore
 */
export const gameParticipationConverter: FirestoreDataConverter<GameParticipation> =
  {
    toFirestore: (participation: GameParticipation) =>
      gameParticipationToFirestore(participation),
    fromFirestore: (snapshot, options) => {
      const data = snapshot.data(options) as GameParticipationDocument;
      return gameParticipationFromFirestore(data);
    },
  };

/**
 * Submission converter for Firestore
 */
export const submissionConverter: FirestoreDataConverter<Submission> = {
  toFirestore: (submission: Submission) => submissionToFirestore(submission),
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options) as SubmissionDocument;
    return submissionFromFirestore(data);
  },
};

/**
 * Event converter for Firestore
 */
export const eventConverter: FirestoreDataConverter<Event> = {
  toFirestore: (event: Event) => eventToFirestore(event),
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options) as EventDocument;
    return eventFromFirestore(data);
  },
};

/**
 * Get a reference to the users collection with type conversion
 */
export function getUsersCollection(collectionPath = "users") {
  return collection(firestore, collectionPath).withConverter(userConverter);
}

/**
 * Get a reference to a specific user document with type conversion
 */
export function getUserDoc(id: string, collectionPath = "users") {
  return doc(collection(firestore, collectionPath), id).withConverter(
    userConverter,
  );
}

/**
 * Get a reference to the notifications collection with type conversion
 */
export function getNotificationsCollection(collectionPath = "notifications") {
  return collection(firestore, collectionPath).withConverter(
    notificationConverter,
  );
}

/**
 * Get a reference to a specific notification document with type conversion
 */
export function getNotificationDoc(
  id: string,
  collectionPath = "notifications",
) {
  return doc(collection(firestore, collectionPath), id).withConverter(
    notificationConverter,
  );
}

/**
 * Get a reference to the games collection with type conversion
 */
export function getGamesCollection(collectionPath = "games") {
  return collection(firestore, collectionPath).withConverter(gameConverter);
}

/**
 * Get a reference to a specific game document with type conversion
 */
export function getGameDoc(id: string, collectionPath = "games") {
  return doc(collection(firestore, collectionPath), id).withConverter(
    gameConverter,
  );
}

/**
 * Get a reference to the game board subcollection with type conversion
 */
export function getGameBoardCollection(gameId: string) {
  return collection(firestore, `games/${gameId}/board`).withConverter(
    gameBoardConverter,
  );
}

/**
 * Get a reference to a specific game board document with type conversion
 */
export function getGameBoardDoc(gameId: string, id = "board") {
  return doc(collection(firestore, `games/${gameId}/board`), id).withConverter(
    gameBoardConverter,
  );
}

/**
 * Get a reference to the player boards subcollection with type conversion
 */
export function getPlayerBoardsCollection(gameId: string) {
  return collection(firestore, `games/${gameId}/playerBoards`).withConverter(
    playerBoardConverter,
  );
}

/**
 * Get a reference to a specific player board document with type conversion
 */
export function getPlayerBoardDoc(gameId: string, userId: string) {
  return doc(
    collection(firestore, `games/${gameId}/playerBoards`),
    userId,
  ).withConverter(playerBoardConverter);
}

/**
 * Get a reference to the game participations collection with type conversion
 */
export function getGameParticipationsCollection(
  collectionPath = "game_participations",
) {
  return collection(firestore, collectionPath).withConverter(
    gameParticipationConverter,
  );
}

/**
 * Get a reference to a specific game participation document with type conversion
 */
export function getGameParticipationDoc(
  id: string,
  collectionPath = "game_participations",
) {
  return doc(collection(firestore, collectionPath), id).withConverter(
    gameParticipationConverter,
  );
}

/**
 * Get a reference to the participants subcollection with type conversion
 */
export function getParticipantsCollection(gameId: string) {
  return collection(firestore, `games/${gameId}/participants`).withConverter(
    gameParticipationConverter,
  );
}

/**
 * Get a reference to a specific participant document with type conversion
 */
export function getParticipantDoc(gameId: string, userId: string) {
  return doc(
    collection(firestore, `games/${gameId}/participants`),
    userId,
  ).withConverter(gameParticipationConverter);
}

/**
 * Get a reference to the submissions subcollection with type conversion
 */
export function getSubmissionsCollection(gameId: string) {
  return collection(firestore, `games/${gameId}/submissions`).withConverter(
    submissionConverter,
  );
}

/**
 * Get a reference to a specific submission document with type conversion
 */
export function getSubmissionDoc(gameId: string, submissionId: string) {
  return doc(
    collection(firestore, `games/${gameId}/submissions`),
    submissionId,
  ).withConverter(submissionConverter);
}

/**
 * Get a reference to the events subcollection with type conversion
 */
export function getEventsCollection(gameId: string) {
  return collection(firestore, `games/${gameId}/events`).withConverter(
    eventConverter,
  );
}

/**
 * Get a reference to a specific event document with type conversion
 */
export function getEventDoc(gameId: string, eventId: string) {
  return doc(
    collection(firestore, `games/${gameId}/events`),
    eventId,
  ).withConverter(eventConverter);
}
