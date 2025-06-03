import { validateGameId } from "@/lib/api-utils";
import { adminFirestore } from "@/lib/firebase/admin";
import { type UserDocument, userFromFirestore } from "@/types/user";
import { NextResponse } from "next/server";

/**
 * GET handler for retrieving game participants
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
  console.log("ℹ️ XXX: ~ route.ts ~ request:", request);
  try {
    const { gameId } = await params;

    const validationError = validateGameId(gameId);
    if (validationError) return validationError;

    const participantsSnapshot = await adminFirestore
      .collection(`games/${gameId}/participants`)
      .get();

    if (participantsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Get all participant user IDs
    const userIds = participantsSnapshot.docs.map((doc) => doc.id);

    // Fetch user data for each participant
    const participants = await Promise.all(
      userIds.map(async (userId) => {
        const userDoc = await adminFirestore
          .collection("users")
          .doc(userId)
          .get();

        if (!userDoc.exists) {
          return {
            id: userId,
            username: "Unknown User",
          };
        }

        const userData = userDoc.data();
        if (!userData) {
          return {
            id: userId,
            username: "Unknown User",
          };
        }

        // Convert Firestore data to application model
        const user = userFromFirestore({
          ...userData,
          id: userId,
        } as UserDocument);

        // Return only the necessary fields
        return {
          id: userId,
          username: user.username,
        };
      }),
    );

    // Sort by username and return in ApiResponse format
    return NextResponse.json({
      success: true,
      data: participants.sort((a, b) => a.username.localeCompare(b.username)),
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { error: "Failed to fetch participants" },
      { status: 500 },
    );
  }
}
