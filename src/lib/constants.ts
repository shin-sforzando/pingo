/**
 * Application constants
 */

// Base URL for the application
export const BASE_URL =
  // biome-ignore lint/complexity/useOptionalChain: In the browser environment, process does not exist, so a reference error occurs.
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BASE_URL) ||
  "http://localhost:3000";

/**
 * Game ID configuration
 */
export const GAME_ID_LENGTH = 6;
export const GAME_ID_PATTERN = /^[A-Z0-9]{6}$/;
