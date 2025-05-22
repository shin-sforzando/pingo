import { adminFirestore } from "@/lib/firebase/admin";
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

    if (!gameId) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 },
      );
    }

    const participantsSnapshot = await adminFirestore
      .collection(`games/${gameId}/participants`)
      .get();

    if (participantsSnapshot.empty) {
      return NextResponse.json([]);
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

        return {
          id: userId,
          username: userData?.username || "Unknown User",
        };
      }),
    );

    // Sort by username
    return NextResponse.json(
      participants.sort((a, b) => a.username.localeCompare(b.username)),
    );
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { error: "Failed to fetch participants" },
      { status: 500 },
    );
  }
}
