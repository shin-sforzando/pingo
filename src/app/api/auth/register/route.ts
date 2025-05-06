import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
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

    // Create user document in Firestore
    const now = new Date().toISOString();
    await usersRef.doc(uid).set({
      id: uid,
      handle,
      createdAt: now,
      lastLoginAt: now,
      participatingGames: [],
      gameHistory: [],
    });

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
