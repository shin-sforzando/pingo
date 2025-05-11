/**
 * Firestore collections with type converters
 */
import {
  type FirestoreDataConverter,
  collection,
  doc,
} from "firebase/firestore";
import type { Notification, User } from "../../types/schema";
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
