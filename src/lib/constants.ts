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

/**
 * Bingo board configuration
 */
export const BOARD_SIZE = 5;
export const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE; // 25
export const BOARD_CENTER_COORD = Math.floor(BOARD_SIZE / 2); // 2 (center of [0,1,2,3,4])
export const CENTER_CELL_INDEX = Math.floor(TOTAL_CELLS / 2); // 12 (center of 0-24 array)
export const NON_FREE_CELLS = TOTAL_CELLS - 1; // 24 (excluding center FREE cell)

/**
 * Game and user limits
 */
export const MAX_GAMES_PER_USER = 10; // Maximum games per user (cumulative, including ended games)
export const MAX_PARTICIPANTS_PER_GAME = 30; // Maximum participants per game
