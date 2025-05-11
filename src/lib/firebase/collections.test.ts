/**
 * Tests for Firestore collections with type converters
 */
import { deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { afterEach, describe, expect, it } from "vitest";
import { NotificationDisplayType, NotificationType } from "../../types/common";
import type { Notification, User } from "../../types/schema";
import { notificationToFirestore, userToFirestore } from "../../types/user";
import { firestore } from "./client";
import {
  getNotificationDoc,
  getNotificationsCollection,
  getUserDoc,
  getUsersCollection,
  notificationConverter,
  userConverter,
} from "./collections";

describe("Firestore Collections with Converters", () => {
  // Test collection names to avoid affecting real data
  const testUsersCollection = "users_test";
  const testNotificationsCollection = "notifications_test";

  // Test IDs
  const testUserId = "test-user-123";
  const testNotificationId = "test-notification-123";

  // Test data
  const testUser: User = {
    id: testUserId,
    username: "John Doe",
    createdAt: new Date(),
    lastLoginAt: null,
    participatingGames: [],
    gameHistory: [],
    isTestUser: true,
  };

  const testNotification: Notification = {
    id: testNotificationId,
    type: NotificationType.GAME_INVITATION,
    displayType: NotificationDisplayType.TOAST,
    message: "Test notification",
    createdAt: new Date(),
    read: false,
  };

  // Clean up after each test
  afterEach(async () => {
    try {
      await deleteDoc(doc(firestore, testUsersCollection, testUserId));
      await deleteDoc(
        doc(firestore, testNotificationsCollection, testNotificationId),
      );
    } catch (error) {
      console.error("Error cleaning up test data:", error);
    }
  });

  describe("User Converter", () => {
    it("should convert User object to Firestore document", () => {
      const firestoreData = userConverter.toFirestore(testUser);
      expect(firestoreData).toEqual(userToFirestore(testUser));
      expect(firestoreData.id).toBe(testUser.id);
      expect(firestoreData.username).toBe(testUser.username);
      expect(firestoreData.createdAt).toBeDefined();
    });
  });

  describe("Notification Converter", () => {
    it("should convert Notification object to Firestore document", () => {
      const firestoreData = notificationConverter.toFirestore(testNotification);
      expect(firestoreData).toEqual(notificationToFirestore(testNotification));
      expect(firestoreData.id).toBe(testNotification.id);
      expect(firestoreData.message).toBe(testNotification.message);
      expect(firestoreData.createdAt).toBeDefined();
    });
  });

  describe("User Collection Functions", () => {
    it("should get a reference to the users collection with converter", () => {
      const usersRef = getUsersCollection(testUsersCollection);
      expect(usersRef).toBeDefined();
      // Check that the path is correct
      expect(usersRef.path).toBe(testUsersCollection);
    });

    it("should get a reference to a user document with converter", () => {
      const userRef = getUserDoc(testUserId, testUsersCollection);
      expect(userRef).toBeDefined();
      // Check that the path is correct
      expect(userRef.path).toBe(`${testUsersCollection}/${testUserId}`);
    });

    it("should save and retrieve a user with type conversion", async () => {
      // Save the user
      const userRef = getUserDoc(testUserId, testUsersCollection);
      await setDoc(userRef, testUser);

      // Retrieve the user
      const docSnap = await getDoc(userRef);
      expect(docSnap.exists()).toBe(true);

      const retrievedUser = docSnap.data();
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.id).toBe(testUser.id);
      expect(retrievedUser?.username).toBe(testUser.username);

      // Check that dates are properly converted
      expect(retrievedUser?.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("Notification Collection Functions", () => {
    it("should get a reference to the notifications collection with converter", () => {
      const notificationsRef = getNotificationsCollection(
        testNotificationsCollection,
      );
      expect(notificationsRef).toBeDefined();
      // Check that the path is correct
      expect(notificationsRef.path).toBe(testNotificationsCollection);
    });

    it("should get a reference to a notification document with converter", () => {
      const notificationRef = getNotificationDoc(
        testNotificationId,
        testNotificationsCollection,
      );
      expect(notificationRef).toBeDefined();
      // Check that the path is correct
      expect(notificationRef.path).toBe(
        `${testNotificationsCollection}/${testNotificationId}`,
      );
    });

    it("should save and retrieve a notification with type conversion", async () => {
      // Save the notification
      const notificationRef = getNotificationDoc(
        testNotificationId,
        testNotificationsCollection,
      );
      await setDoc(notificationRef, testNotification);

      // Retrieve the notification
      const docSnap = await getDoc(notificationRef);
      expect(docSnap.exists()).toBe(true);

      const retrievedNotification = docSnap.data();
      expect(retrievedNotification).toBeDefined();
      expect(retrievedNotification?.id).toBe(testNotification.id);
      expect(retrievedNotification?.message).toBe(testNotification.message);

      // Check that dates are properly converted
      expect(retrievedNotification?.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("Collection Queries", () => {
    it("should query users collection with type conversion", async () => {
      // Save the user
      const userRef = getUserDoc(testUserId, testUsersCollection);
      await setDoc(userRef, testUser);

      // Query the collection
      const usersRef = getUsersCollection(testUsersCollection);
      const querySnapshot = await getDocs(usersRef);

      expect(querySnapshot.empty).toBe(false);
      expect(querySnapshot.size).toBeGreaterThanOrEqual(1);

      // Check that at least one document matches our test user
      const foundUser = querySnapshot.docs.find((doc) => doc.id === testUserId);
      expect(foundUser).toBeDefined();

      if (foundUser) {
        const userData = foundUser.data();
        expect(userData.id).toBe(testUser.id);
        expect(userData.username).toBe(testUser.username);
        expect(userData.createdAt).toBeInstanceOf(Date);
      }
    });
  });
});
