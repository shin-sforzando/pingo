import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
import { timestampHelpers } from "@/models/Timestamp";
import { userSchema } from "@/models/User";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Update user information
 * @route PUT /api/auth/update
 * @param request - The request object
 * @returns NextResponse with success status
 */
export async function PUT(request: NextRequest) {
  try {
    // Get the ID token from the Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid token" },
        { status: 401 },
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get updated user data from request body
    const { username } = await request.json();

    // If username is provided, validate and check if it's already taken
    if (username) {
      // Validate username using the User schema
      try {
        // Extract just the username validation from the User schema
        const usernameSchema = userSchema.shape.username;
        usernameSchema.parse(username);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          return NextResponse.json(
            { error: validationError.errors[0].message },
            { status: 400 },
          );
        }
      }

      const usersRef = adminFirestore.collection("users");
      const query = usersRef.where("username", "==", username);
      const snapshot = await query.get();

      // If username exists and belongs to another user, return error
      if (!snapshot.empty && snapshot.docs[0].id !== uid) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 },
        );
      }

      // Update user document in Firestore with timestamp
      await usersRef.doc(uid).update({
        username,
        updatedAt: timestampHelpers.now(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}
