import { type NextRequest, NextResponse } from "next/server";

import { adminAuth } from "@/lib/firebase/admin";
import { AdminUserService } from "@/lib/firebase/admin-collections";
import type { ApiResponse } from "@/types/common";
import type { User } from "@/types/schema";

/**
 * Get authenticated user data
 * GET /api/auth/me
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<{ user: User }>>> {
  try {
    // Get authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "unauthorized",
            message: "Auth.errors.unauthorized",
          },
        },
        { status: 401 },
      );
    }

    // Extract token
    const token = authHeader.split("Bearer ")[1];
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "unauthorized",
            message: "Auth.errors.unauthorized",
          },
        },
        { status: 401 },
      );
    }

    // Verify token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get user data using data access layer
    const user = await AdminUserService.getUser(userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "user_not_found",
            message: "Auth.errors.userNotFound",
          },
        },
        { status: 404 },
      );
    }

    // Debug output
    console.log(
      `ℹ️ XXX: ~ route.ts ~ Auth /me API - User authenticated: ${user.username} (ID: ${user.id})`,
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          user,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get user error:", error);
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
