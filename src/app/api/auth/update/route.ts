import bcrypt from "bcrypt";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { adminFirestore } from "@/lib/firebase/admin";
import type { ApiResponse } from "@/types/common";
import { dateToTimestamp } from "@/types/firestore";
import type { User } from "@/types/schema";
import type { UserDocument } from "@/types/user";
import { userFromFirestore } from "@/types/user";

// User update schema
const userUpdateSchema = z.object({
  userId: z.string().uuid(),
  username: z
    .string()
    .min(3, { message: "Auth.errors.usernameTooShort" })
    .max(20, { message: "Auth.errors.usernameTooLong" })
    .optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8, { message: "Auth.errors.passwordTooShort" })
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]+$/, {
      message: "Auth.errors.passwordInvalid",
    })
    .optional(),
});

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
            code: "validation_error",
            message: "Auth.errors.invalidInput",
            details: validationResult.error.format(),
          },
        },
        { status: 400 },
      );
    }

    const { userId, username, currentPassword, newPassword } =
      validationResult.data;

    // Get user document
    const usersRef = adminFirestore.collection("users");
    const userSnapshot = await usersRef.doc(userId).get();

    if (!userSnapshot.exists) {
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

    const userDoc = userSnapshot.data() as UserDocument;
    const updateData: Record<string, unknown> = {};
    const now = new Date();
    updateData.updatedAt = dateToTimestamp(now);

    // Check if username is being updated
    if (username && username !== userDoc.username) {
      // Check if the new username is already taken
      const usernameQuery = await usersRef
        .where("username", "==", username)
        .limit(1)
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

      updateData.username = username;
    }

    // Check if password is being updated
    if (newPassword) {
      // Verify current password if provided
      if (currentPassword) {
        const passwordMatch = await bcrypt.compare(
          currentPassword,
          userDoc.passwordHash,
        );
        if (!passwordMatch) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "invalid_password",
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
              code: "missing_password",
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

    // If there are no updates, return success with current user data
    if (Object.keys(updateData).length === 1 && updateData.updatedAt) {
      const user = userFromFirestore(userDoc);
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

    // Update user document
    await usersRef.doc(userId).update(updateData);

    // Get updated user document
    const updatedUserSnapshot = await usersRef.doc(userId).get();
    const updatedUserDoc = updatedUserSnapshot.data() as UserDocument;
    const user = userFromFirestore(updatedUserDoc);

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
    console.error("User update error:", error);
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
