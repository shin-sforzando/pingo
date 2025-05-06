import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

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
    const { handle } = await request.json();

    // If handle is provided, check if it's already taken by another user
    if (handle) {
      const usersRef = adminFirestore.collection("users");
      const query = usersRef.where("handle", "==", handle);
      const snapshot = await query.get();

      // If handle exists and belongs to another user, return error
      if (!snapshot.empty && snapshot.docs[0].id !== uid) {
        return NextResponse.json(
          { error: "Handle is already taken" },
          { status: 400 },
        );
      }

      // Update user document in Firestore
      await usersRef.doc(uid).update({
        handle,
        updatedAt: new Date().toISOString(),
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
