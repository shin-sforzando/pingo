import { adminFirestore } from "@/lib/firebase/admin";
import { NextResponse } from "next/server";

/**
 * GET handler for retrieving game board data
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

    const boardDoc = await adminFirestore
      .collection(`games/${gameId}/board`)
      .doc("board")
      .get();

    if (!boardDoc.exists) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Return board data
    return NextResponse.json(boardDoc.data());
  } catch (error) {
    console.error("Error fetching game board:", error);
    return NextResponse.json(
      { error: "Failed to fetch game board" },
      { status: 500 },
    );
  }
}
