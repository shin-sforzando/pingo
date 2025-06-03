import type { ApiResponse } from "@/types/common";
import type { Game, GameBoard } from "@/types/schema";

/**
 * Participant data with username
 */
export interface Participant {
  id: string;
  username: string;
}

/**
 * Fetch game data by ID via API
 * @param gameId The ID of the game to fetch
 * @returns The game data or null if not found
 */
export async function getGameData(gameId: string): Promise<Game | null> {
  try {
    const response = await fetch(`/api/game/${gameId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<Game> = await response.json();

    if (!result.success || !result.data) {
      console.error("API error:", result.error);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching game data:", error);
    return null;
  }
}

/**
 * Fetch game board data by game ID via API
 * @param gameId The ID of the game
 * @returns The game board data or null if not found
 */
export async function getGameBoard(gameId: string): Promise<GameBoard | null> {
  try {
    const response = await fetch(`/api/game/${gameId}/board`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<GameBoard> = await response.json();

    if (!result.success || !result.data) {
      console.error("API error:", result.error);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching game board:", error);
    return null;
  }
}

/**
 * Fetch participants for a game via API
 * @param gameId The ID of the game
 * @returns Array of participants with usernames
 */
export async function getParticipants(gameId: string): Promise<Participant[]> {
  try {
    const response = await fetch(`/api/game/${gameId}/participants`);

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<Participant[]> = await response.json();

    if (!result.success || !result.data) {
      console.error("API error:", result.error);
      return [];
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching participants:", error);
    return [];
  }
}
