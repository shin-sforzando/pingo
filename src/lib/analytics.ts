/**
 * Google Analytics helper functions
 *
 * Provides type-safe wrappers for GA4 event tracking with user consent management.
 */

// LocalStorage key for storing analytics consent
const CONSENT_KEY = "pingo_analytics_consent";

// GA4 Event parameter types
type GtagEventParams = Record<string, string | number | boolean | undefined>;
type GtagConsentParams = {
  analytics_storage: "granted" | "denied";
};

// Extend window object to include gtag with proper typing
declare global {
  interface Window {
    gtag?: {
      (command: "config", targetId: string, config?: GtagEventParams): void;
      (command: "event", eventName: string, params?: GtagEventParams): void;
      (command: "set", params: GtagEventParams): void;
      (command: "consent", action: "update", params: GtagConsentParams): void;
    };
  }
}

/**
 * Analytics event definitions
 *
 * Defines all possible analytics events with their required parameters.
 * This ensures type safety when tracking events.
 */
type AnalyticsEvent =
  | {
      name: "game_created";
      params: { game_id: string; board_size: string };
    }
  | {
      name: "game_joined";
      params: { game_id: string };
    }
  | {
      name: "game_started";
      params: { game_id: string };
    }
  | {
      name: "image_uploaded";
      params: { game_id: string; cell_id: string };
    }
  | {
      name: "cell_matched";
      params: { game_id: string; cell_id: string; subject: string };
    }
  | {
      name: "bingo_achieved";
      params: { game_id: string; pattern_type: string };
    }
  | {
      name: "game_completed";
      params: { game_id: string };
    }
  | {
      name: "image_upload_failed";
      params: {
        game_id: string;
        failure_phase: string;
        error_message?: string;
      };
    }
  | {
      name: "image_rejected";
      params: { game_id: string; rejection_reason: string };
    }
  | {
      name: "gemini_analysis_failed";
      params: { game_id: string; error_type: string; error_message?: string };
    }
  | {
      name: "image_no_match";
      params: { game_id: string };
    };

/**
 * Check if user has given consent for analytics tracking.
 *
 * This function checks localStorage for stored consent preference.
 * If no preference is stored, returns false (opt-in approach for GDPR compliance).
 *
 * @returns true if user has consented, false otherwise
 */
export function hasUserConsent(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const consent = localStorage.getItem(CONSENT_KEY);
    return consent === "granted";
  } catch (error) {
    // If localStorage is not available, assume no consent
    console.error("Failed to check analytics consent:", error);
    return false;
  }
}

/**
 * Set user's analytics consent preference.
 *
 * This also configures Google Analytics consent mode.
 *
 * @param granted - true if user grants consent, false if user denies
 */
export function setUserConsent(granted: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");

    // Update GA consent mode if gtag is available
    if (window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: granted ? "granted" : "denied",
      });
    }

    // Dispatch custom event to notify same-tab listeners
    window.dispatchEvent(new CustomEvent("pingo:analytics-consent"));
  } catch (error) {
    console.error("Failed to set analytics consent:", error);
  }
}

/**
 * Sends a custom event to Google Analytics with type safety.
 *
 * Events are only sent if:
 * 1. GA is properly configured (NEXT_PUBLIC_GA_MEASUREMENT_ID is set)
 * 2. gtag function is available
 * 3. User has given consent (GDPR/CCPA compliance)
 *
 * @param eventName - Name of the event to track
 * @param eventParams - Event parameters matching the event name
 */
export function trackEvent<T extends AnalyticsEvent>(
  eventName: T["name"],
  eventParams: T["params"],
): void {
  // Check user consent first (GDPR/CCPA compliance)
  if (!hasUserConsent()) {
    return;
  }

  // Only send events if GA is configured and available
  if (
    typeof window !== "undefined" &&
    window.gtag &&
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  ) {
    try {
      window.gtag("event", eventName, eventParams as GtagEventParams);
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
 * Note: Currently not implemented in the UI. Reserved for future use.
 *
 * @param gameId - The ID of the game
 */
export function trackGameCompleted(gameId: string) {
  trackEvent("game_completed", {
    game_id: gameId,
  });
}

/**
 * Tracks when image upload fails at infrastructure level.
 *
 * This includes failures during:
 * - Signed URL generation
 * - Cloud Storage upload
 * - Submission record creation
 * - Unknown error types (non-Gemini related)
 *
 * @param gameId - The ID of the game
 * @param phase - The phase where the upload failed
 * @param errorMessage - Optional error message for debugging
 */
export function trackImageUploadFailed(
  gameId: string,
  phase:
    | "url_generation"
    | "storage_upload"
    | "submission_creation"
    | "unknown",
  errorMessage?: string,
) {
  trackEvent("image_upload_failed", {
    game_id: gameId,
    failure_phase: phase,
    error_message: errorMessage,
  });
}

/**
 * Tracks when an uploaded image is rejected as inappropriate.
 *
 * This occurs during the content safety check phase before Gemini analysis.
 *
 * @param gameId - The ID of the game
 * @param reason - Optional reason why the image was rejected
 */
export function trackImageRejected(gameId: string, reason?: string) {
  trackEvent("image_rejected", {
    game_id: gameId,
    rejection_reason: reason || "unspecified",
  });
}

/**
 * Tracks when Gemini AI analysis fails.
 *
 * This is distinct from upload failures and content rejection.
 * It indicates issues with the AI analysis service itself.
 *
 * @param gameId - The ID of the game
 * @param errorType - Type of error encountered
 * @param errorMessage - Optional error message for debugging
 */
export function trackGeminiAnalysisFailed(
  gameId: string,
  errorType: "api_error" | "timeout" | "rate_limit" | "unknown",
  errorMessage?: string,
) {
  trackEvent("gemini_analysis_failed", {
    game_id: gameId,
    error_type: errorType,
    error_message: errorMessage,
  });
}

/**
 * Tracks when an image is successfully analyzed but doesn't match any cell.
 *
 * This helps monitor game difficulty and AI accuracy.
 *
 * @param gameId - The ID of the game
 */
export function trackImageNoMatch(gameId: string) {
  trackEvent("image_no_match", {
    game_id: gameId,
  });
}
