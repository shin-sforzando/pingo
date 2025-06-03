import { type NextRequest, NextResponse } from "next/server";

import { AdminUserService } from "@/lib/firebase/admin-collections";
import type { ApiResponse } from "@/types/common";

/**
 * User logout API
 * POST /api/auth/logout
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<{ success: boolean }>>> {
  try {
    // Get request body
    const body = await request.json();
    const { userId } = body;

    // Validate userId
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "invalid_request",
            message: "Auth.errors.userIdRequired",
          },
        },
        { status: 400 },
      );
    }

    // Update user's last activity timestamp using data access layer
    try {
      const now = new Date();
      await AdminUserService.updateUserPartial(userId, {
        updatedAt: now,
      });
    } catch (error) {
      console.error(`Failed to update user ${userId} timestamp:`, error);
      // Continue with logout even if update fails
    }

    // In a real implementation, we might revoke tokens or invalidate sessions
    // For Firebase custom tokens, they expire automatically after 1 hour
    // For long-lived sessions, we would maintain a blacklist of revoked tokens

    return NextResponse.json(
      {
        success: true,
        data: {
          success: true,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("User logout error:", error);
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
