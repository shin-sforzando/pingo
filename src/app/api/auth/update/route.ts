import bcrypt from "bcrypt";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { AdminUserService } from "@/lib/firebase/admin-collections";
import type { ApiResponse } from "@/types/common";
import { type User, userCreationSchema, userSchema } from "@/types/schema";

// Define password update fields
const passwordUpdateFields = z.object({
  currentPassword: z.string().optional(),
  newPassword: userCreationSchema.shape.password.optional(),
});

// User update schema - using userSchema.shape.id for userId validation
const userUpdateSchema = z
  .object({
    // Use userSchema.shape.id for consistent ID validation
    userId: userSchema.shape.id,

    // Optional username with validation from userSchema
    username: userSchema.shape.username.optional(),
  })
  .extend(passwordUpdateFields.shape);

/**
 * User update API
 * PUT /api/auth/update
 */
export async function PUT(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<{ user: User }>>> {
  try {
    // Get request body
    const body = await request.json();

    // Validate input data
    const validationResult = userUpdateSchema.safeParse(body);
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

    const { userId, username, currentPassword, newPassword } =
      validationResult.data;

    // Get user and user document for password verification if needed
    let user = null;
    let userDocForPassword = null;

    if (newPassword) {
      // If password update is needed, get user document with password hash
      userDocForPassword = await AdminUserService.getUserDocumentById(userId);
      if (!userDocForPassword) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "USER_NOT_FOUND",
              message: "Auth.errors.userNotFound",
            },
          },
          { status: 404 },
        );
      }
      // Convert user document to user object for other operations
      user = await AdminUserService.getUser(userId);
    } else {
      // If no password update, just get user object
      user = await AdminUserService.getUser(userId);
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "Auth.errors.userNotFound",
          },
        },
        { status: 404 },
      );
    }

    const updateData: Record<string, unknown> = {};
    const now = new Date();
    updateData.updatedAt = now;

    // Check if username is being updated
    if (username && username !== user.username) {
      // Check if the new username is already taken using data access layer
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

      updateData.username = username;
    }

    // Check if password is being updated
    if (newPassword && userDocForPassword) {
      // Verify current password if provided
      if (currentPassword) {
        const passwordMatch = await bcrypt.compare(
          currentPassword,
          userDocForPassword.passwordHash,
        );
        if (!passwordMatch) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "INVALID_PASSWORD",
                message: "Auth.errors.currentPasswordInvalid",
              },
            },
            { status: 401 },
          );
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "MISSING_PASSWORD",
              message: "Auth.errors.currentPasswordRequired",
            },
          },
          { status: 400 },
        );
      }

      // Hash new password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);
      updateData.passwordHash = passwordHash;
    }

    // If there are no updates other than the updatedAt timestamp, return success with current user data
    if (Object.keys(updateData).length === 1 && updateData.updatedAt) {
      return NextResponse.json(
        {
          success: true,
          data: {
            user,
          },
        },
        { status: 200 },
      );
    }

    // Update user document using data access layer
    await AdminUserService.updateUserPartial(userId, updateData);

    // Get updated user data
    const updatedUser = await AdminUserService.getUser(userId);
    if (!updatedUser) {
      throw new Error("User not found after update");
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: updatedUser,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("User update error:", error);
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
