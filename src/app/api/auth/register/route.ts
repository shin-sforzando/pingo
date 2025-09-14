import bcrypt from "bcrypt";
import { type NextRequest, NextResponse } from "next/server";
import { ulid } from "ulid";

import { adminAuth } from "@/lib/firebase/admin";
import { AdminUserService } from "@/lib/firebase/admin-collections";
import type { ApiResponse } from "@/types/common";
import type { User } from "@/types/schema";
import { userCreationSchema } from "@/types/schema";

/**
 * User registration API
 * POST /api/auth/register
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<{ user: User; token: string }>>> {
  try {
    // Get request body
    const body = await request.json();

    // Validate input data
    const validationResult = userCreationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Auth.errors.invalidInput",
            details: validationResult.error.issues,
          },
        },
        { status: 400 },
      );
    }

    const { username, password, isTestUser } = validationResult.data;

    // Check for duplicate username using data access layer
    const isUsernameTaken = await AdminUserService.isUsernameTaken(username);
    if (isUsernameTaken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USERNAME_EXISTS",
            message: "Auth.errors.usernameExists",
          },
        },
        { status: 400 },
      );
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user data
    const userId = ulid();
    const now = new Date();
    const user: User = {
      id: userId,
      username,
      createdAt: now,
      updatedAt: null,
      lastLoginAt: now,
      participatingGames: [],
      gameHistory: [],
      isTestUser: isTestUser || false,
    };

    // Save user data to Firestore using data access layer
    await AdminUserService.createUser(user, passwordHash);

    // Create custom token for authentication
    const customToken = await adminAuth.createCustomToken(userId);

    return NextResponse.json(
      {
        success: true,
        data: {
          user,
          token: customToken,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("User registration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Auth.errors.serverError",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 },
    );
  }
}
