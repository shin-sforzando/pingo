/**
 * Application constants
 */

// Base URL for the application
export const BASE_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BASE_URL) ||
  "http://localhost:3000";

/**
 * Game ID configuration
 */
export const GAME_ID_LENGTH = 6;
export const GAME_ID_PATTERN = /^[A-Z0-9]{6}$/;

/**
 * Gemini API configuration
 * Note: "gemini-2.0-flash-001" is stable and fast, but does not support extension thinking.
 * "gemini-2.5-flash" supports extension thinking, but response times are slow and unit tests may fail.
 */
export const GEMINI_MODEL = "gemini-2.5-flash";

/**
 * Gemini thinking budget configuration
 * 0 = No thinking (fastest, equivalent to gemini-2.0-flash speed)
 * -1 = Dynamic thinking (model decides, slower but potentially more accurate)
 * 1000+ = Deep thinking (slowest, most accurate for complex tasks)
 *
 * For Pingo's image analysis use case, speed is prioritized over deep reasoning
 */
export const GEMINI_THINKING_BUDGET = 0;
