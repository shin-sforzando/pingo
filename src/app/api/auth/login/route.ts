import bcrypt from "bcrypt";
import { type NextRequest, NextResponse } from "next/server";

import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
import type { ApiResponse } from "@/types/common";
import { type TimestampInterface, dateToTimestamp } from "@/types/firestore";
import { userLoginSchema } from "@/types/schema";
import type { User } from "@/types/schema";
import { userFromFirestore } from "@/types/user";
import type { UserDocument } from "@/types/user";

/**
 * User login API
 * POST /api/auth/login
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<{ user: User; token: string }>>> {
  try {
    // Get request body
    const body = await request.json();

    // Validate input data
    const validationResult = userLoginSchema.safeParse(body);
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

    const { username, password } = validationResult.data;

    // Find user by username
    const usersRef = adminFirestore.collection("users");
    const usernameQuery = await usersRef
      .where("username", "==", username)
      .limit(1)
      .get();

    if (usernameQuery.empty) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "auth_failed",
            message: "Auth.errors.invalidCredentials",
          },
        },
        { status: 401 },
      );
    }

    // Get user document
    const userDoc = usernameQuery.docs[0].data() as UserDocument;

    // Verify password
    const passwordMatch = await bcrypt.compare(password, userDoc.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "auth_failed",
            message: "Auth.errors.invalidCredentials",
          },
        },
        { status: 401 },
      );
    }

    // Update last login time
    const now = new Date();
    await usersRef.doc(userDoc.id).update({
      lastLoginAt: dateToTimestamp(now),
      updatedAt: dateToTimestamp(now),
    });

    // Update user object with new login time
    userDoc.lastLoginAt = dateToTimestamp(now) as TimestampInterface;
    userDoc.updatedAt = dateToTimestamp(now) as TimestampInterface;

    // Convert to user model
    const user = userFromFirestore(userDoc);

    // Create custom token for authentication
    const customToken = await adminAuth.createCustomToken(userDoc.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          user,
          token: customToken,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("User login error:", error);
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
