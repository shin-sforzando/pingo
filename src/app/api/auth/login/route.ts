import bcrypt from "bcrypt";
import { type NextRequest, NextResponse } from "next/server";

import { adminAuth } from "@/lib/firebase/admin";
import { AdminUserService } from "@/lib/firebase/admin-collections";
import type { ApiResponse } from "@/types/common";
import type { User } from "@/types/schema";
import { userLoginSchema } from "@/types/schema";

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
            code: "VALIDATION_ERROR",
            message: "Auth.errors.invalidInput",
            details: validationResult.error.format(),
          },
        },
        { status: 400 },
      );
    }

    const { username, password } = validationResult.data;

    // Find user document by username using data access layer (includes passwordHash)
    const userDoc = await AdminUserService.getUserDocumentByUsername(username);

    if (!userDoc) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "AUTH_FAILED",
            message: "Auth.errors.invalidCredentials",
          },
        },
        { status: 401 },
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, userDoc.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "AUTH_FAILED",
            message: "Auth.errors.invalidCredentials",
          },
        },
        { status: 401 },
      );
    }

    // Update last login time using data access layer
    await AdminUserService.updateLastLogin(userDoc.id);

    // Get updated user data (without passwordHash)
    const user = await AdminUserService.getUserByUsername(username);
    if (!user) {
      throw new Error("User not found after login");
    }

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
