import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
const apps = getApps();
if (!apps.length) {
  // In production (Cloud Run), the Firebase credentials are accessed via Secret Manager
  // The secrets are mounted as environment variables by Cloud Run
  // Secret names in Secret Manager: firebase-project-id, firebase-client-email, firebase-private-key

  try {
    // Check if we have the necessary environment variables from Secret Manager
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      // Private key handling - try different formats
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;

      // Try to handle different possible formats of the private key
      if (privateKey) {
        // 1. If it contains literal \n strings, replace them with actual newlines
        if (privateKey.includes("\\n")) {
          privateKey = privateKey.replace(/\\n/g, "\n");
          console.log("Replaced escaped newlines in private key");
        }

        // 2. If it's wrapped in quotes (from Secret Manager or Docker ENV), remove them
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.slice(1, -1);
          console.log("Removed surrounding quotes from private key");
        }

        // 3. Check if it has the expected PEM format
        if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
          console.error(
            "Private key does not have the expected PEM format beginning",
          );
        }
      }

      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
      console.log(
        "ℹ️ XXX: ~ Firebase Admin initialized with Secret Manager credentials",
      );
    }
    // For local development, use the service account file
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        console.log(
          "ℹ️ XXX: ~ Attempting to initialize Firebase Admin with GOOGLE_APPLICATION_CREDENTIALS",
        );
        initializeApp();
        console.log(
          "ℹ️ XXX: ~ Firebase Admin initialized with GOOGLE_APPLICATION_CREDENTIALS",
        );
      } catch (initError) {
        console.error(
          "Firebase Admin initialization error with GOOGLE_APPLICATION_CREDENTIALS:",
          initError,
        );
        throw initError;
      }
    } else {
      throw new Error("Firebase credentials not found");
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    // In production, we might want to handle this more gracefully
    // For now, we'll let the error propagate to crash the app
    // This ensures we don't run with improper authentication
    throw error;
  }
}

// Export admin services
export const adminAuth = getAuth();
export const adminFirestore = getFirestore();

/**
 * Cloud Run and Secret Manager Setup Instructions:
 *
 * 1. Create secrets in Secret Manager:
 *    - firebase-project-id: Your Firebase project ID
 *    - firebase-client-email: Service account email from Firebase
 *    - firebase-private-key: Private key from Firebase service account
 *
 * 2. Grant the Cloud Run service account access to these secrets:
 *    - roles/secretmanager.secretAccessor
 *
 * 3. Configure Cloud Run to mount these secrets as environment variables:
 *    - FIREBASE_PROJECT_ID: projects/[PROJECT_ID]/secrets/firebase-project-id/versions/latest
 *    - FIREBASE_CLIENT_EMAIL: projects/[PROJECT_ID]/secrets/firebase-client-email/versions/latest
 *    - FIREBASE_PRIVATE_KEY: projects/[PROJECT_ID]/secrets/firebase-private-key/versions/latest
 */
