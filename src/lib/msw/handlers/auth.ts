import { userSchema } from "@/lib/validators/models/user";
import { http, HttpResponse } from "msw";
import { z } from "zod";

// --- Mock Data Store ---
// Simple in-memory store for mock users. Reset on server restart.
const mockUsers: z.infer<typeof userSchema>[] = [];
// Simple state to track the currently "logged in" user for the mock session.
let loggedInUserId: string | null = null;

// Helper to find user by ID in the mock store.
const findUserById = (id: string) => mockUsers.find((u) => u.id === id);

// --- Schemas for Request Bodies (Subset of userSchema) ---

// Schema for registration request body.
const registerSchema = z.object({
  handle: userSchema.shape.handle, // Reuse handle validation from userSchema
  // Mock password validation - real app would have stronger requirements.
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." }),
});

// Schema for login request body.
const loginSchema = z.object({
  handle: userSchema.shape.handle,
  password: z.string(), // No complex validation needed for mock login logic.
});

// Schema for user update request body. Allows partial updates.
const updateSchema = z
  .object({
    handle: userSchema.shape.handle.optional(),
    settings: userSchema.shape.settings.optional(),
  })
  .partial(); // Use partial to allow updating only some fields.

// --- MSW Handlers for /api/auth/* ---

export const authHandlers = [
  /**
   * POST /api/auth/register
   * Handles new user registration.
   */
  http.post("/api/auth/register", async ({ request }) => {
    try {
      const body = await request.json();
      const parsedBody = registerSchema.safeParse(body);

      // Validate request body.
      if (!parsedBody.success) {
        return HttpResponse.json(
          {
            message: "Invalid registration data",
            errors: parsedBody.error.flatten(),
          },
          { status: 400 }, // Bad Request
        );
      }

      const { handle } = parsedBody.data;

      // Check if handle already exists in our mock store.
      if (mockUsers.some((u) => u.handle === handle)) {
        return HttpResponse.json(
          { message: "Handle already taken" },
          { status: 409 }, // Conflict
        );
      }

      // Create a new mock user object.
      const newUser: z.infer<typeof userSchema> = {
        // Generate a simple unique ID for the mock user.
        id: `mock_user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        handle: handle,
        createdAt: new Date(),
        lastLoginAt: new Date(), // Set last login on registration
        participatingGames: [],
        gameHistory: [],
        note: "New user created via registration",
        settings: {},
      };

      // Ensure the created user conforms to the full userSchema.
      const validatedUser = userSchema.parse(newUser);

      // Add the new user to the mock store.
      mockUsers.push(validatedUser);
      // Automatically "log in" the newly registered user in the mock session.
      loggedInUserId = validatedUser.id;

      console.log("[MSW] Registered and logged in user:", validatedUser);
      // Return the created user data with a 201 status.
      return HttpResponse.json(validatedUser, { status: 201 }); // Created
    } catch (error) {
      console.error("[MSW] /api/auth/register Error:", error);
      // Handle potential Zod errors during final validation or other unexpected errors.
      if (error instanceof z.ZodError) {
        return HttpResponse.json(
          { message: "Internal validation failed", errors: error.flatten() },
          { status: 500 },
        );
      }
      return HttpResponse.json(
        { message: "Internal server error during registration" },
        { status: 500 },
      );
    }
  }),

  /**
   * POST /api/auth/login
   * Handles user login attempts.
   */
  http.post("/api/auth/login", async ({ request }) => {
    try {
      const body = await request.json();
      const parsedBody = loginSchema.safeParse(body);

      // Validate request body.
      if (!parsedBody.success) {
        return HttpResponse.json(
          { message: "Invalid login data", errors: parsedBody.error.flatten() },
          { status: 400 }, // Bad Request
        );
      }

      const { handle, password } = parsedBody.data;
      // Find user by handle in the mock store.
      const user = mockUsers.find((u) => u.handle === handle);

      // --- Mock Password Check ---
      // IMPORTANT: This is a highly simplified check for mock purposes ONLY.
      // A real application MUST use secure password hashing (e.g., bcrypt).
      const isPasswordCorrect = password === "password123"; // Use a fixed mock password

      if (!user || !isPasswordCorrect) {
        return HttpResponse.json(
          { message: "Invalid handle or password" },
          { status: 401 }, // Unauthorized
        );
      }

      // Update last login time and set mock session state.
      user.lastLoginAt = new Date();
      loggedInUserId = user.id;
      console.log("[MSW] Logged in user:", user);
      // Return the logged-in user data.
      return HttpResponse.json(user);
    } catch (error) {
      console.error("[MSW] /api/auth/login Error:", error);
      return HttpResponse.json(
        { message: "Internal server error during login" },
        { status: 500 },
      );
    }
  }),

  /**
   * POST /api/auth/logout
   * Handles user logout.
   */
  http.post("/api/auth/logout", () => {
    // Check if a user is actually logged in in the mock session.
    if (!loggedInUserId) {
      // Arguably, logout could succeed even if not logged in, but 401 indicates state mismatch.
      return HttpResponse.json(
        { message: "Not currently logged in" },
        { status: 401 },
      );
    }
    console.log(`[MSW] Logging out user: ${loggedInUserId}`);
    // Clear the mock session state.
    loggedInUserId = null;
    return HttpResponse.json({ message: "Logout successful" }, { status: 200 });
  }),

  /**
   * PUT /api/auth/update
   * Handles updates to the logged-in user's settings.
   */
  http.put("/api/auth/update", async ({ request }) => {
    // Check for active mock session.
    if (!loggedInUserId) {
      return HttpResponse.json(
        { message: "Unauthorized: No user logged in" },
        { status: 401 },
      );
    }

    // Find the user in the mock store based on the logged-in ID.
    const userIndex = mockUsers.findIndex((u) => u.id === loggedInUserId);
    if (userIndex === -1) {
      // This indicates an inconsistent state (loggedInUserId set but user not found).
      console.error(
        `[MSW] Inconsistent state: loggedInUserId ${loggedInUserId} not found in mockUsers.`,
      );
      loggedInUserId = null; // Clear inconsistent state
      return HttpResponse.json(
        { message: "User session error" },
        { status: 404 },
      ); // Not Found or internal error
    }
    const currentUser = mockUsers[userIndex];

    try {
      const body = await request.json();
      // Validate the incoming update data. Allows partial updates.
      const parsedBody = updateSchema.safeParse(body);

      if (!parsedBody.success) {
        return HttpResponse.json(
          {
            message: "Invalid update data",
            errors: parsedBody.error.flatten(),
          },
          { status: 400 }, // Bad Request
        );
      }

      const updates = parsedBody.data;
      // Use const as the variable itself is not reassigned, only its properties are mutated.
      const updatedUser = { ...currentUser };

      // Check handle uniqueness if handle is being updated.
      if (updates.handle && updates.handle !== currentUser.handle) {
        if (
          mockUsers.some(
            (u, index) => index !== userIndex && u.handle === updates.handle,
          )
        ) {
          return HttpResponse.json(
            { message: "Handle already taken by another user" },
            { status: 409 }, // Conflict
          );
        }
        updatedUser.handle = updates.handle;
      }

      // Merge settings updates.
      if (updates.settings) {
        updatedUser.settings = { ...updatedUser.settings, ...updates.settings };
      }

      // Validate the *entire* user object after applying updates.
      const validatedUser = userSchema.parse(updatedUser);

      // Update the user in the mock database array.
      mockUsers[userIndex] = validatedUser;

      console.log("[MSW] Updated user:", validatedUser);
      // Return the updated user data.
      return HttpResponse.json(validatedUser);
    } catch (error) {
      console.error("[MSW] /api/auth/update Error:", error);
      // Handle potential Zod errors during final validation or other unexpected errors.
      if (error instanceof z.ZodError) {
        return HttpResponse.json(
          {
            message: "Validation failed after update",
            errors: error.flatten(),
          },
          { status: 400 },
        );
      }
      return HttpResponse.json(
        { message: "Internal server error during update" },
        { status: 500 },
      );
    }
  }),

  /**
   * GET /api/auth/session
   * Example endpoint to retrieve the currently logged-in user's data.
   */
  http.get("/api/auth/session", () => {
    // Check for active mock session.
    if (!loggedInUserId) {
      // Return null or an empty object based on API contract for unauthenticated users.
      // Returning null with 200 might be preferable to 401 for session checks.
      return HttpResponse.json(null, { status: 200 });
    }
    // Find the user based on the mock session ID.
    const user = findUserById(loggedInUserId);
    if (!user) {
      // Inconsistent state, clear mock session.
      loggedInUserId = null;
      console.error(
        `[MSW] Inconsistent state: loggedInUserId ${loggedInUserId} not found during session check.`,
      );
      return HttpResponse.json(null, { status: 200 }); // Still return null
    }
    // Convert Date objects to ISO strings before returning JSON,
    // mimicking standard JSON serialization behavior.
    const userForJson = {
      ...user,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt.toISOString(),
    };
    return HttpResponse.json(userForJson);
  }),
];
