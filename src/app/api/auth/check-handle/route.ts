import { adminFirestore } from "@/lib/firebase/admin";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Check if a handle is available
 * @route POST /api/auth/check-handle
 * @param request - The request object
 * @returns NextResponse with available status
 */
export async function POST(request: NextRequest) {
  try {
    const { handle } = await request.json();

    if (!handle) {
      return NextResponse.json(
        { error: "Handle is required" },
        { status: 400 },
      );
    }

    // Check if handle already exists in Firestore
    const usersRef = adminFirestore.collection("users");
    const query = usersRef.where("handle", "==", handle);
    const snapshot = await query.get();

    return NextResponse.json({
      available: snapshot.empty,
    });
  } catch (error) {
    console.error("Error checking handle availability:", error);
    return NextResponse.json(
      { error: "Failed to check handle availability" },
      { status: 500 },
    );
  }
}
