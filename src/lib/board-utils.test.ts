/**
 * Tests for board utility functions
 */
import { describe, expect, it } from "vitest";
import type { Cell } from "@/types/schema";
import {
  getCellAtPosition,
  isValidBoardStructure,
  shuffleBoardCells,
} from "./board-utils";

/**
 * Create a test board with 25 cells
 */
function createTestBoard(): Cell[] {
  const cells: Cell[] = [];
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      const index = y * 5 + x;
      cells.push({
        id: `cell_${index}`,
        position: { x, y },
        subject: `Subject ${index}`,
        isFree: x === 2 && y === 2, // Center cell is FREE
      });
    }
  }
  return cells;
}

describe("shuffleBoardCells", () => {
  it("should return 25 cells", () => {
    const originalCells = createTestBoard();
    const shuffledCells = shuffleBoardCells(originalCells);
    expect(shuffledCells).toHaveLength(25);
  });

  it("should preserve cell IDs and subjects", () => {
    const originalCells = createTestBoard();
    const shuffledCells = shuffleBoardCells(originalCells);

    // Check that all IDs are preserved
    const originalIds = originalCells.map((c) => c.id).sort();
    const shuffledIds = shuffledCells.map((c) => c.id).sort();
    expect(shuffledIds).toEqual(originalIds);

    // Check that subjects match by ID (cell_id to subject mapping is preserved)
    for (const originalCell of originalCells) {
      const shuffledCell = shuffledCells.find((c) => c.id === originalCell.id);
      expect(shuffledCell).toBeDefined();
      expect(shuffledCell?.subject).toEqual(originalCell.subject);
      expect(shuffledCell?.isFree).toEqual(originalCell.isFree);
    }
  });

  it("should keep FREE cell at center position (2,2)", () => {
    const originalCells = createTestBoard();
    const freeCell = originalCells.find((c) => c.isFree);
    expect(freeCell).toBeDefined();

    const shuffledCells = shuffleBoardCells(originalCells);
    const shuffledFreeCell = shuffledCells.find((c) => c.isFree);

    // FREE cell should be at center position after shuffle
    expect(shuffledFreeCell).toBeDefined();
    expect(shuffledFreeCell?.position).toEqual({ x: 2, y: 2 });
    expect(shuffledFreeCell?.id).toBe(freeCell?.id);
    expect(shuffledFreeCell?.subject).toBe(freeCell?.subject);
  });

  it("should shuffle positions of non-FREE cells", () => {
    const originalCells = createTestBoard();

    // Run shuffle multiple times to check randomness
    let hasShuffled = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      const shuffledCells = shuffleBoardCells(originalCells);

      // Compare positions by cell ID (excluding FREE cell)
      for (const originalCell of originalCells) {
        if (originalCell.isFree) continue; // Skip FREE cell

        const shuffledCell = shuffledCells.find(
          (c) => c.id === originalCell.id,
        );
        expect(shuffledCell).toBeDefined();

        // Check if position changed
        if (
          shuffledCell?.position.x !== originalCell.position.x ||
          shuffledCell?.position.y !== originalCell.position.y
        ) {
          hasShuffled = true;
          break;
        }
      }

      if (hasShuffled) break;
    }

    // In 10 attempts, at least one cell should have a different position
    expect(hasShuffled).toBe(true);
  });

  it("should throw error for invalid cell count", () => {
    const invalidCells = createTestBoard().slice(0, 24);
    expect(() => shuffleBoardCells(invalidCells)).toThrow(
      "Board must have exactly 25 cells",
    );
  });

  it("should throw error if FREE cell is missing", () => {
    const cellsWithoutFree = createTestBoard().map((c) => ({
      ...c,
      isFree: false, // Make all cells non-FREE
    }));

    expect(() => shuffleBoardCells(cellsWithoutFree)).toThrow(
      "FREE cell not found",
    );
  });

  it("should not modify original array", () => {
    const originalCells = createTestBoard();
    const originalCellsCopy = JSON.parse(JSON.stringify(originalCells));

    shuffleBoardCells(originalCells);

    // Original should remain unchanged
    expect(originalCells).toEqual(originalCellsCopy);
  });
});

describe("getCellAtPosition", () => {
  it("should return cell at specified position", () => {
    const cells = createTestBoard();
    const cell = getCellAtPosition(cells, 2, 2);

    expect(cell).toBeDefined();
    expect(cell?.position).toEqual({ x: 2, y: 2 });
  });

  it("should return undefined for non-existent position", () => {
    const cells = createTestBoard();
    const cell = getCellAtPosition(cells, 5, 5);

    expect(cell).toBeUndefined();
  });
});

describe("isValidBoardStructure", () => {
  it("should return true for valid board", () => {
    const cells = createTestBoard();
    expect(isValidBoardStructure(cells)).toBe(true);
  });

  it("should return false for board with wrong cell count", () => {
    const cells = createTestBoard().slice(0, 24);
    expect(isValidBoardStructure(cells)).toBe(false);
  });

  it("should return false for board with missing positions", () => {
    const cells = createTestBoard();
    // Remove one cell and replace with duplicate
    cells.pop();
    cells.push({
      id: "cell_duplicate",
      position: { x: 0, y: 0 }, // Duplicate position
      subject: "Duplicate",
      isFree: false,
    });

    expect(isValidBoardStructure(cells)).toBe(false);
  });

  it("should return false for board without FREE center cell", () => {
    const cells = createTestBoard();
    const centerCell = cells.find(
      (c) => c.position.x === 2 && c.position.y === 2,
    );
    if (centerCell) {
      centerCell.isFree = false; // Make center cell not FREE
    }

    expect(isValidBoardStructure(cells)).toBe(false);
  });
});
