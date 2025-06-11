import { describe, expect, it } from "vitest";
import { adminAuth, adminFirestore } from "./admin";

describe("Firebase Admin Initialization", () => {
  it("should initialize Firebase Admin with environment variables", () => {
    // Verify environment variables are loaded
    expect(process.env.GOOGLE_CLOUD_PROJECT_ID).toBeDefined();

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log(
        "ℹ️ XXX: ~ admin.test.ts ~ Using GOOGLE_APPLICATION_CREDENTIALS:",
        process.env.GOOGLE_APPLICATION_CREDENTIALS,
      );
    } else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      console.log(
        "ℹ️ XXX: ~ admin.test.ts ~ Using Firebase credentials from environment variables",
      );
    } else {
      console.warn("No Firebase credentials found in environment");
    }

    // Verify Firebase Admin services are initialized
    expect(adminAuth).toBeDefined();
    expect(adminFirestore).toBeDefined();
  });

  it("should be able to connect to Firestore", async () => {
    // Create a simple test document in a test collection
    const testDoc = await adminFirestore
      .collection("vitest_init_test")
      .doc("test_connection")
      .set({
        timestamp: new Date(),
        test: "Firebase Admin initialization test",
      });

    expect(testDoc).toBeDefined();

    // Clean up the test document
    await adminFirestore
      .collection("vitest_init_test")
      .doc("test_connection")
      .delete();
  });
});
