import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
import bcrypt from "bcrypt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Login a user
 * @route POST /api/auth/login
 * @param request - The request object
 * @returns NextResponse with custom token for Firebase Auth
 */
export async function POST(request: NextRequest) {
  try {
    const { handle, password } = await request.json();

    if (!handle || !password) {
      return NextResponse.json(
        { error: "Handle and password are required" },
        { status: 400 },
      );
    }

    // Find user by handle
    const usersRef = adminFirestore.collection("users");
    const query = usersRef.where("handle", "==", handle);
    const snapshot = await query.get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: "Invalid handle or password" },
        { status: 401 },
      );
    }

    // Get the user document
    const userDoc = snapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    // Verify the password
    if (!userData.passwordHash) {
      return NextResponse.json(
        { error: "Authentication failed: Password hash not found" },
        { status: 401 },
      );
    }

    // Compare the provided password with the stored hash
    const passwordMatch = await bcrypt.compare(password, userData.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid handle or password" },
        { status: 401 },
      );
    }

    // Update last login time
    await userDoc.ref.update({
      lastLoginAt: new Date().toISOString(),
    });

    // Create a custom token for the user
    const customToken = await adminAuth.createCustomToken(userId);

    return NextResponse.json({ customToken });
  } catch (error) {
    console.error("Error logging in:", error);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}
