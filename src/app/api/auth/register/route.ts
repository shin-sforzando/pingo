import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
import bcrypt from "bcrypt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Register a new user
 * @route POST /api/auth/register
 * @param request - The request object
 * @returns NextResponse with success status
 */
export async function POST(request: NextRequest) {
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

    // Get handle and password from request body
    const { handle, password } = await request.json();

    if (!handle || !password) {
      return NextResponse.json(
        { error: "Handle and password are required" },
        { status: 400 },
      );
    }
    try {
      // Check if handle already exists
      const usersRef = adminFirestore.collection("users");
      const query = usersRef.where("handle", "==", handle);
      const snapshot = await query.get();
      if (!snapshot.empty) {
        return NextResponse.json(
          { error: "Handle is already taken" },
          { status: 400 },
        );
      }
    } catch (queryError) {
      console.error("Error executing Firestore query:", queryError);

      // If there's a NOT_FOUND error, it likely means the collection doesn't exist yet
      // In this case, we can proceed with registration as the handle is available
      if (
        queryError &&
        typeof queryError === "object" &&
        "code" in queryError &&
        queryError.code === 5
      ) {
        // Continue with registration
      } else {
        // For other errors, return a 500 error
        console.error("Unexpected error checking handle:", queryError);
        return NextResponse.json(
          { error: "Failed to check handle availability" },
          { status: 500 },
        );
      }
    }

    // Create user document in Firestore
    try {
      const now = new Date().toISOString();
      const usersCollection = adminFirestore.collection("users");
      // Hash the password with bcrypt
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      await usersCollection.doc(uid).set({
        id: uid,
        handle,
        passwordHash, // Store the hashed password
        createdAt: now,
        lastLoginAt: now,
        participatingGames: [],
        gameHistory: [],
      });
    } catch (docError) {
      console.error("Error creating user document:", docError);
      throw new Error(
        `Failed to create user document: ${docError instanceof Error ? docError.message : String(docError)}`,
      );
    }

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error registering user:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 },
    );
  }
}
