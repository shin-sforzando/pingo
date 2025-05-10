import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
import { timestampHelpers } from "@/models/Timestamp";
import { userSchema } from "@/models/User";
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
    let username: string | undefined;
    let password: string | undefined;
    try {
      const body = (await request.json()) as {
        username?: string;
        password?: string;
      };
      username = body.username;
      password = body.password;
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 },
      );
    }

    // Validate username - check for invalid characters
    const usernameResult = userSchema.shape.username.safeParse(username);
    if (!usernameResult.success) {
      return NextResponse.json(
        { error: "Username contains invalid characters" },
        { status: 400 },
      );
    }

    // Find user by username
    const usersRef = adminFirestore.collection("users");
    const query = usersRef.where("username", "==", username);
    const snapshot = await query.get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: "Invalid username or password" },
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
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    // Update last login time
    await userDoc.ref.update({
      lastLoginAt: timestampHelpers.now(),
    });

    // Create a custom token for the user
    const customToken = await adminAuth.createCustomToken(userId);

    return NextResponse.json({ customToken });
  } catch (error) {
    console.error("Error logging in:", error);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}
