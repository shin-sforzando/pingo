import { NextResponse } from "next/server";

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage: string,
) {
  try {
    return await operation();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export function validateGameId(gameId: string | undefined) {
  if (!gameId) {
    return NextResponse.json({ error: "Game ID is required" }, { status: 400 });
  }
  return null;
}
