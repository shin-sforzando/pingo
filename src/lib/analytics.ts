/**
 * Google Analytics helper functions
 *
 * Provides type-safe wrappers for GA4 event tracking.
 */

// Extend window object to include gtag
declare global {
  interface Window {
    gtag?: (
      command: "config" | "event" | "set",
      targetId: string,
      config?: Record<string, unknown>,
    ) => void;
  }
}

/**
 * Sends a custom event to Google Analytics.
 *
 * @param eventName - Name of the event to track
 * @param eventParams - Optional parameters to send with the event
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, unknown>,
) {
  // Only send events if GA is configured and available
  if (
    typeof window !== "undefined" &&
    window.gtag &&
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  ) {
    try {
      window.gtag("event", eventName, eventParams);
    } catch (error) {
      // Silently fail in production to avoid disrupting user experience
      if (process.env.NODE_ENV === "development") {
        console.error("Analytics tracking error:", error);
      }
    }
  }
}

/**
 * Tracks when a user creates a new game.
 *
 * @param gameId - The ID of the created game
 * @param boardSize - Size of the game board (e.g., 3x3, 5x5)
 */
export function trackGameCreated(gameId: string, boardSize: number) {
  trackEvent("game_created", {
    game_id: gameId,
    board_size: `${boardSize}x${boardSize}`,
  });
}

/**
 * Tracks when a user joins an existing game.
 *
 * @param gameId - The ID of the joined game
 */
export function trackGameJoined(gameId: string) {
  trackEvent("game_joined", {
    game_id: gameId,
  });
}

/**
 * Tracks when a user starts playing a game.
 *
 * @param gameId - The ID of the game being played
 */
export function trackGameStarted(gameId: string) {
  trackEvent("game_started", {
    game_id: gameId,
  });
}

/**
 * Tracks when a user uploads an image for analysis.
 *
 * @param gameId - The ID of the game
 * @param cellId - The cell ID where the image was uploaded
 */
export function trackImageUploaded(gameId: string, cellId: string) {
  trackEvent("image_uploaded", {
    game_id: gameId,
    cell_id: cellId,
  });
}

/**
 * Tracks when an uploaded image successfully matches a cell.
 *
 * @param gameId - The ID of the game
 * @param cellId - The matched cell ID
 * @param subject - The subject that was matched
 */
export function trackCellMatched(
  gameId: string,
  cellId: string,
  subject: string,
) {
  trackEvent("cell_matched", {
    game_id: gameId,
    cell_id: cellId,
    subject,
  });
}

/**
 * Tracks when a user achieves a bingo.
 *
 * @param gameId - The ID of the game
 * @param patternType - Type of bingo pattern achieved (e.g., 'row', 'column', 'diagonal')
 */
export function trackBingoAchieved(gameId: string, patternType: string) {
  trackEvent("bingo_achieved", {
    game_id: gameId,
    pattern_type: patternType,
  });
}

/**
 * Tracks when a user completes the entire board (all cells matched).
 *
 * @param gameId - The ID of the game
 */
export function trackGameCompleted(gameId: string) {
  trackEvent("game_completed", {
    game_id: gameId,
  });
}
