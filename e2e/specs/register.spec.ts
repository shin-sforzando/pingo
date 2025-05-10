import { expect, test } from "@playwright/test";
import {
  generateTestUsername,
  login,
  logout,
  registerUser,
} from "../helpers/auth-helper";

// Test suite for user registration
test.describe("User Registration", () => {
  // Generate a unique test username for this test run
  const testUsername = generateTestUsername();
  const password = "TestPassword123!";

  // After all tests, clean up test data
  test.afterAll(async () => {
    // We'll use the cleanup script to remove test data
    // This is handled separately via npm run test:cleanup
  });

  test("should register a new user", async ({ page }) => {
    // Register a new user
    await registerUser(page, testUsername, password);

    // Verify user is logged in by checking for user menu
    await expect(page.getByTestId("my-avatar")).toBeVisible();
  });

  test("should login with registered user", async ({ page }) => {
    // Login with the registered user
    await login(page, testUsername, password);

    // Verify user is logged in by checking for user menu
    await expect(page.getByTestId("my-avatar")).toBeVisible();
  });

  test("should logout", async ({ page }) => {
    // First login
    await login(page, testUsername, password);

    // Then logout
    await logout(page);

    // Verify user is logged out by checking for login form
    await expect(page.locator(".max-w-md")).toBeVisible();
  });
});
