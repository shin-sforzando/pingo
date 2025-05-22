import { adminFirestore } from "@/lib/firebase/admin";
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

    if (!gameId) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 },
      );
    }

    const gameDoc = await adminFirestore.collection("games").doc(gameId).get();

    if (!gameDoc.exists) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Return game data with proper date conversion
    return NextResponse.json({
      ...gameDoc.data(),
      id: gameDoc.id,
      createdAt: gameDoc.data()?.createdAt?.toDate() || new Date(),
      expiresAt: gameDoc.data()?.expiresAt?.toDate() || new Date(),
    });
  } catch (error) {
    console.error("Error fetching game data:", error);
    return NextResponse.json(
      { error: "Failed to fetch game data" },
      { status: 500 },
    );
  }
}
