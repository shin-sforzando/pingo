import { validateGameId } from "@/lib/api-utils";
import { adminFirestore } from "@/lib/firebase/admin";
import { type GameDocument, gameFromFirestore } from "@/types/game";
import { NextResponse } from "next/server";

/**
 * GET handler for retrieving game data
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

    const gameDoc = await adminFirestore.collection("games").doc(gameId).get();

    if (!gameDoc.exists) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const gameData = gameDoc.data();
    if (!gameData) {
      return NextResponse.json(
        { error: "Game data is empty" },
        { status: 404 },
      );
    }

    // Convert Firestore data to application model using the converter function
    const convertedGame = gameFromFirestore({
      ...gameData,
      id: gameDoc.id,
    } as GameDocument);

    // Return the converted game data
    return NextResponse.json(convertedGame);
  } catch (error) {
    console.error("Error fetching game data:", error);
    return NextResponse.json(
      { error: "Failed to fetch game data" },
      { status: 500 },
    );
  }
}
