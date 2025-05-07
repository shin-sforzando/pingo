import { adminFirestore } from "@/lib/firebase/admin";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Check if a username is available
 * @route POST /api/auth/check-username
 * @param request - The request object
 * @returns NextResponse with available status
 */
export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    // Validate username - check for invalid characters
    if (/[.$/]/.test(username)) {
      return NextResponse.json(
        { error: "Username contains invalid characters", available: false },
        { status: 400 },
      );
    }

    try {
      // Check if username already exists in Firestore
      const usersRef = adminFirestore.collection("users");
      const query = usersRef.where("username", "==", username);
      const snapshot = await query.get();

      return NextResponse.json({
        available: snapshot.empty,
      });
    } catch (queryError) {
      console.error("Error executing Firestore query:", queryError);

      // If there's a NOT_FOUND error, it likely means the collection doesn't exist yet
      // In this case, the username is available
      if (
        queryError &&
        typeof queryError === "object" &&
        "code" in queryError &&
        queryError.code === 5
      ) {
        // 5 is the code for NOT_FOUND
        return NextResponse.json({
          available: true,
        });
      }

      throw queryError; // Re-throw other errors
    }
  } catch (error) {
    console.error("Error checking username availability:", error);
    return NextResponse.json(
      { error: "Failed to check username availability" },
      { status: 500 },
    );
  }
}
