import { validateGameId } from "@/lib/api-utils";
import { adminFirestore } from "@/lib/firebase/admin";
import { type GameBoardDocument, gameBoardFromFirestore } from "@/types/game";
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

    const validationError = validateGameId(gameId);
    if (validationError) return validationError;

    const boardDoc = await adminFirestore
      .collection(`games/${gameId}/board`)
      .doc("board")
      .get();

    if (!boardDoc.exists) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const boardData = boardDoc.data();
    if (!boardData) {
      return NextResponse.json(
        { error: "Board data is empty" },
        { status: 404 },
      );
    }

    // Convert Firestore data to application model
    // Type cast to GameBoardDocument to satisfy TypeScript
    const convertedBoard = gameBoardFromFirestore(
      boardData as GameBoardDocument,
    );

    // Return the converted board data
    return NextResponse.json(convertedBoard);
  } catch (error) {
    console.error("Error fetching game board:", error);
    return NextResponse.json(
      { error: "Failed to fetch game board" },
      { status: 500 },
    );
  }
}
