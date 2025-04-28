import { userSchema } from "@/lib/validators/models/user";
import { beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";

// Create a schema specifically for validating API responses where dates are strings
const userApiResponseSchema = userSchema.extend({
  createdAt: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
  }, z.date()),
  lastLoginAt: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
  }, z.date()),
  // Keep other fields as they are in userSchema
});

// Note: MSW server lifecycle (listen, resetHandlers, close) is managed globally
// in the vitest.setup.ts file based on the previous step.

describe("MSW Auth Handlers (/api/auth/*)", () => {
  const testApiBase = "/api/auth";

  // --- POST /api/auth/register ---
  describe("POST /register", () => {
    it("should register a new user successfully", async () => {
      const newUser = { handle: "NewTester", password: "password123" };
      const response = await fetch(`${testApiBase}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      const parsedData = userApiResponseSchema.safeParse(data);
      expect(
        parsedData.success,
        `Invalid response data: ${JSON.stringify(parsedData.error?.flatten())}`,
      ).toBe(true);
      if (parsedData.success) {
        expect(parsedData.data.handle).toBe(newUser.handle);
        expect(parsedData.data.id).toBeDefined();
      }
    });

    it("should return 409 if handle is already taken", async () => {
      // First, register a user
      await fetch(`${testApiBase}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: "ExistingHandle",
          password: "password123",
        }),
      });
      // Then, try to register with the same handle
      const response = await fetch(`${testApiBase}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: "ExistingHandle",
          password: "anotherPassword",
        }),
      });
      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.message).toBe("Handle already taken");
    });

    it("should return 400 for invalid registration data", async () => {
      const response = await fetch(`${testApiBase}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: "T", password: "short" }), // Invalid handle and password
      });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Invalid registration data");
      expect(data.errors?.fieldErrors?.handle).toBeDefined();
      expect(data.errors?.fieldErrors?.password).toBeDefined();
    });
  });

  // --- POST /api/auth/login ---
  describe("POST /login", () => {
    // Register a user to test login against
    beforeAll(async () => {
      await fetch(`${testApiBase}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: "LoginUser", password: "password123" }),
      });
      // Logout immediately after registration if the mock auto-logs in
      await fetch(`${testApiBase}/logout`, { method: "POST" });
    });

    it("should login successfully with correct credentials", async () => {
      const response = await fetch(`${testApiBase}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: "LoginUser", password: "password123" }),
      });
      expect(response.status).toBe(200);
      const data = await response.json();

      const parsedData = userApiResponseSchema.safeParse(data);
      expect(parsedData.success).toBe(true);
      if (parsedData.success) {
        expect(parsedData.data.handle).toBe("LoginUser");
      }
    });

    it("should return 401 for incorrect password", async () => {
      const response = await fetch(`${testApiBase}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: "LoginUser",
          password: "wrongpassword",
        }),
      });
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toBe("Invalid handle or password");
    });

    it("should return 401 for non-existent handle", async () => {
      const response = await fetch(`${testApiBase}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: "NoSuchUser", password: "password123" }),
      });
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toBe("Invalid handle or password");
    });

    it("should return 400 for invalid login data format", async () => {
      const response = await fetch(`${testApiBase}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: 123 }), // Invalid handle type
      });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Invalid login data");
    });
  });

  // --- POST /api/auth/logout ---
  describe("POST /logout", () => {
    beforeAll(async () => {
      // Ensure a user is logged in before testing logout
      await fetch(`${testApiBase}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: "LoginUser", password: "password123" }),
      });
    });

    it("should logout successfully when logged in", async () => {
      const response = await fetch(`${testApiBase}/logout`, { method: "POST" });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe("Logout successful");

      // Verify session is cleared (optional, depends on session endpoint)
      const sessionResponse = await fetch(`${testApiBase}/session`);
      expect(sessionResponse.status).toBe(200); // Assuming session returns 200 with null body when logged out
      const sessionData = await sessionResponse.json();
      expect(sessionData).toBeNull();
    });

    it("should return 401 if already logged out", async () => {
      // First logout ensures state is logged out
      await fetch(`${testApiBase}/logout`, { method: "POST" });
      // Second attempt should fail
      const response = await fetch(`${testApiBase}/logout`, { method: "POST" });
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toBe("Not currently logged in");
    });
  });

  // --- GET /api/auth/session ---
  describe("GET /session", () => {
    it("should return user data when logged in", async () => {
      // Log in first
      await fetch(`${testApiBase}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: "LoginUser", password: "password123" }),
      });

      const response = await fetch(`${testApiBase}/session`);
      expect(response.status).toBe(200);
      const data = await response.json();

      const parsedData = userApiResponseSchema.safeParse(data);
      expect(parsedData.success).toBe(true);
      if (parsedData.success) {
        expect(parsedData.data.handle).toBe("LoginUser");
      }
    });

    it("should return null or 401 when logged out", async () => {
      // Ensure logged out state
      await fetch(`${testApiBase}/logout`, { method: "POST" });

      const response = await fetch(`${testApiBase}/session`);
      // The mock returns 200 with null body, adjust expectation if needed
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toBeNull();
    });
  });

  // --- PUT /api/auth/update ---
  describe("PUT /update", () => {
    beforeAll(async () => {
      // Register and log in a user for update tests
      await fetch(`${testApiBase}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: "UpdateUser", password: "password123" }),
      });
      // Simulate getting some session identifier if needed by the actual API
    });

    it("should update user profile successfully", async () => {
      const updates = {
        profile: {
          displayName: "Updated Name",
          bio: "Updated bio here.",
        },
      };
      const response = await fetch(`${testApiBase}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          // 'Authorization': `Bearer ${loggedInUserToken}` // If auth needed
        },
        body: JSON.stringify(updates),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      const parsedData = userApiResponseSchema.safeParse(data);
      expect(parsedData.success).toBe(true);
      if (parsedData.success) {
        expect(parsedData.data.handle).toBe("UpdateUser"); // Handle shouldn't change
        expect(parsedData.data.profile?.displayName).toBe("Updated Name");
        expect(parsedData.data.profile?.bio).toBe("Updated bio here.");
      }
    });

    it("should update user handle successfully if available", async () => {
      const updates = { handle: "UpdatedHandle" };
      const response = await fetch(`${testApiBase}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.handle).toBe("UpdatedHandle");
    });

    it("should return 409 if updated handle is taken", async () => {
      // Ensure 'NewTester' handle exists from previous test
      await fetch(`${testApiBase}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: "NewTester", password: "password123" }),
      });
      // Log back in as UpdateUser (now UpdatedHandle)
      await fetch(`${testApiBase}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: "UpdatedHandle",
          password: "password123",
        }),
      });

      const updates = { handle: "NewTester" }; // Try to take existing handle
      const response = await fetch(`${testApiBase}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.message).toBe("Handle already taken by another user");
    });

    it("should return 400 for invalid update data", async () => {
      const updates = { handle: "Invalid Handle!" }; // Invalid char
      const response = await fetch(`${testApiBase}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Invalid update data");
    });

    it("should return 401 if not logged in", async () => {
      await fetch(`${testApiBase}/logout`, { method: "POST" }); // Ensure logged out
      const updates = { profile: { displayName: "Should Fail" } };
      const response = await fetch(`${testApiBase}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      expect(response.status).toBe(401);
    });
  });
});
