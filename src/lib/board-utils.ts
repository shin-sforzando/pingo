/**
 * Board utility functions
 */
import type { Cell } from "@/types/schema";

/**
 * Shuffle board cells using Fisher-Yates algorithm
 * while keeping the center FREE cell at position (2,2)
 *
 * Why shuffle positions instead of subjects:
 * - Maintains cell_id to subject mapping across all players
 * - Enables cross-player queries by subject (e.g., "show all 'milk' photos")
 * - Allows game admin to update subjects globally
 *
 * @param cells Original board cells (25 cells)
 * @returns New array of cells with shuffled positions
 */
export function shuffleBoardCells(cells: Cell[]): Cell[] {
  // Validate input
  if (cells.length !== 25) {
    throw new Error("Board must have exactly 25 cells");
  }

  // Find the FREE cell (should be at center position in master board)
  const freeCellIndex = cells.findIndex((cell) => cell.isFree);

  if (freeCellIndex === -1) {
    throw new Error("FREE cell not found");
  }

  // Extract positions from all cells except the FREE cell
  const positions = cells
    .map((cell, index) => ({ position: cell.position, index }))
    .filter((_, index) => index !== freeCellIndex)
    .map((item) => item.position);

  // Fisher-Yates shuffle algorithm for positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // Create shuffled cells array
  const shuffledCells: Cell[] = [];

  // Assign shuffled positions back to cells (excluding FREE cell)
  let positionIndex = 0;
  for (let i = 0; i < cells.length; i++) {
    if (i === freeCellIndex) {
      // FREE cell always goes to center position (2,2)
      shuffledCells.push({
        ...cells[i],
        position: { x: 2, y: 2 },
      });
    } else {
      // Other cells get shuffled positions
      shuffledCells.push({
        ...cells[i],
        position: positions[positionIndex],
      });
      positionIndex++;
    }
  }

  return shuffledCells;
}

/**
 * Get cell at specific position
 *
 * @param cells Board cells
 * @param x X coordinate (0-4)
 * @param y Y coordinate (0-4)
 * @returns Cell at the specified position or undefined
 */
export function getCellAtPosition(
  cells: Cell[],
  x: number,
  y: number,
): Cell | undefined {
  return cells.find((cell) => cell.position.x === x && cell.position.y === y);
}

/**
 * Check if board has valid structure
 *
 * @param cells Board cells
 * @returns True if board structure is valid
 */
export function isValidBoardStructure(cells: Cell[]): boolean {
  // Must have exactly 25 cells
  if (cells.length !== 25) {
    return false;
  }

  // Create position map for O(1) lookups (instead of O(n) with getCellAtPosition)
  // Why: Optimizes O(n²) → O(n) by building the map once and reusing it
  const positionMap = new Map<string, Cell>();
  for (const cell of cells) {
    const key = `${cell.position.x},${cell.position.y}`;
    // Check for duplicate positions
    if (positionMap.has(key)) {
      return false;
    }
    positionMap.set(key, cell);
  }

  // Check that all positions 0-4 x 0-4 are present
  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
      if (!positionMap.has(`${x},${y}`)) {
        return false;
      }
    }
  }

  // Check that center cell is FREE
  const centerCell = positionMap.get("2,2");
  if (!centerCell || !centerCell.isFree) {
    return false;
  }

  return true;
}
