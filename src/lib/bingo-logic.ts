/**
 * Bingo game logic and line detection utilities
 */
import { BOARD_SIZE } from "@/lib/constants";
import { LineType } from "@/types/common";
import type { CompletedLine, PlayerBoard } from "@/types/schema";

/**
 * Detect completed bingo lines on a player's board
 *
 * Algorithm:
 * 1. Create a 5x5 boolean grid from player board cells and their states
 * 2. Mark cells as open if they are FREE or have isOpen: true
 * 3. Check all rows, columns, and diagonals for completion
 * 4. Return array of completed lines with type, index, and timestamp
 *
 * Why use playerBoard.cells instead of a fixed grid:
 * - Supports shuffle feature where each player has different cell positions
 * - Cell positions are stored in each Cell object, allowing position-independent logic
 *
 * @param playerBoard The player's board with cells and their states
 * @returns Array of completed bingo lines
 */
export function detectCompletedLines(
  playerBoard: PlayerBoard,
): CompletedLine[] {
  const completedLines: CompletedLine[] = [];

  // Create a 5x5 grid mapping for easier line checking
  const grid: boolean[][] = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(false));

  // Fill the grid with open cell states
  // Use playerBoard.cells for shuffle support (each player has different positions)
  for (const cell of playerBoard.cells) {
    const cellState = playerBoard.cellStates[cell.id];
    const isOpen = cell.isFree || cellState?.isOpen || false;
    grid[cell.position.y][cell.position.x] = isOpen;
  }

  // Check rows
  for (let row = 0; row < BOARD_SIZE; row++) {
    if (grid[row].every((cell) => cell)) {
      completedLines.push({
        type: LineType.ROW,
        index: row,
        completedAt: new Date(),
      });
    }
  }

  // Check columns
  for (let col = 0; col < BOARD_SIZE; col++) {
    if (grid.every((row) => row[col])) {
      completedLines.push({
        type: LineType.COLUMN,
        index: col,
        completedAt: new Date(),
      });
    }
  }

  // Check main diagonal (top-left to bottom-right)
  if (grid.every((row, index) => row[index])) {
    completedLines.push({
      type: LineType.DIAGONAL,
      index: 0,
      completedAt: new Date(),
    });
  }

  // Check anti-diagonal (top-right to bottom-left)
  if (grid.every((row, index) => row[BOARD_SIZE - 1 - index])) {
    completedLines.push({
      type: LineType.DIAGONAL,
      index: 1,
      completedAt: new Date(),
    });
  }

  return completedLines;
}
