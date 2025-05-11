import bcrypt from "bcrypt";
import { type NextRequest, NextResponse } from "next/server";
import { ulid } from "ulid";

import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
import type { ApiResponse } from "@/types/common";
import { userCreationSchema } from "@/types/schema";
import type { User } from "@/types/schema";
import { userToFirestore } from "@/types/user";

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
            code: "validation_error",
            message: "Auth.errors.invalidInput",
            details: validationResult.error.format(),
          },
        },
        { status: 400 },
      );
    }

    const { username, password, isTestUser } = validationResult.data;

    // Check for duplicate username
    const usersRef = adminFirestore.collection("users");
    const usernameQuery = await usersRef
      .where("username", "==", username)
      .get();

    if (!usernameQuery.empty) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "username_exists",
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

    // Save user data to Firestore
    const userDoc = userToFirestore(user, passwordHash);
    await usersRef.doc(userId).set(userDoc);

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
          code: "server_error",
          message: "Auth.errors.serverError",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 },
    );
  }
}
