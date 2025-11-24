/**
 * Tests for bingo game logic
 */
import { describe, expect, it } from "vitest";
import {
  BOARD_CENTER_COORD,
  BOARD_SIZE,
  CENTER_CELL_INDEX,
} from "@/lib/constants";
import { LineType } from "@/types/common";
import type { Cell, CellState, PlayerBoard } from "@/types/schema";
import { detectCompletedLines } from "./bingo-logic";
import { shuffleBoardCells } from "./board-utils";

/**
 * Create a test player board with standard 5x5 layout
 * All cells are closed by default except the FREE center cell
 */
function createTestPlayerBoard(): PlayerBoard {
  const cells: Cell[] = [];
  const cellStates: Record<string, CellState> = {};

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const index = y * BOARD_SIZE + x;
      const isFree = index === CENTER_CELL_INDEX;

      const cellId = `cell_${index}`;
      cells.push({
        id: cellId,
        position: { x, y },
        subject: isFree ? "FREE" : `Subject ${index}`,
        isFree,
      });

      // Initialize cell state (FREE cells are always open)
      if (!isFree) {
        cellStates[cellId] = {
          isOpen: false,
        };
      }
    }
  }

  return {
    cells,
    cellStates,
    completedLines: [],
  };
}

/**
 * Create a shuffled player board
 * Uses shuffleBoardCells to randomize positions while keeping FREE at center
 */
function createShuffledPlayerBoard(): PlayerBoard {
  const baseBoard = createTestPlayerBoard();
  const shuffledCells = shuffleBoardCells(baseBoard.cells);

  const cellStates: Record<string, CellState> = {};
  for (const cell of shuffledCells) {
    if (!cell.isFree) {
      cellStates[cell.id] = {
        isOpen: false,
      };
    }
  }

  return {
    cells: shuffledCells,
    cellStates,
    completedLines: [],
  };
}

/**
 * Open cells at specific positions (x, y coordinates)
 * Modifies the player board in place
 */
function openCellsAtPositions(
  playerBoard: PlayerBoard,
  positions: Array<{ x: number; y: number }>,
): void {
  for (const pos of positions) {
    const cell = playerBoard.cells.find(
      (c) => c.position.x === pos.x && c.position.y === pos.y,
    );
    if (cell && !cell.isFree) {
      playerBoard.cellStates[cell.id] = {
        isOpen: true,
        openedAt: new Date(),
      };
    }
  }
}

/**
 * Open specific cells by their IDs
 * Modifies the player board in place
 */
function openCellsByIds(playerBoard: PlayerBoard, cellIds: string[]): void {
  for (const cellId of cellIds) {
    if (playerBoard.cellStates[cellId]) {
      playerBoard.cellStates[cellId] = {
        isOpen: true,
        openedAt: new Date(),
      };
    }
  }
}

describe("detectCompletedLines", () => {
  describe("Empty board (no completed lines)", () => {
    it("should return empty array for fresh board with only FREE cell", () => {
      const playerBoard = createTestPlayerBoard();
      const result = detectCompletedLines(playerBoard);

      expect(result).toEqual([]);
    });

    it("should return empty array for board with partial progress", () => {
      const playerBoard = createTestPlayerBoard();
      // Open a few random cells, not forming any line
      openCellsAtPositions(playerBoard, [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 3, y: 3 },
      ]);

      const result = detectCompletedLines(playerBoard);
      expect(result).toEqual([]);
    });
  });

  describe("Row completion", () => {
    it.each([0, 1, 2, 3, 4])("should detect completed row %i", (rowIndex) => {
      const playerBoard = createTestPlayerBoard();

      // Open all cells in the specified row
      const positions = Array.from({ length: BOARD_SIZE }, (_, x) => ({
        x,
        y: rowIndex,
      }));
      openCellsAtPositions(playerBoard, positions);

      const result = detectCompletedLines(playerBoard);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: LineType.ROW,
        index: rowIndex,
      });
      expect(result[0].completedAt).toBeInstanceOf(Date);
    });

    it("should detect row 2 (middle row with FREE cell)", () => {
      const playerBoard = createTestPlayerBoard();

      // Row 2 contains the FREE cell at (2, 2)
      // Open all non-FREE cells in row 2
      openCellsAtPositions(playerBoard, [
        { x: 0, y: 2 },
        { x: 1, y: 2 },
        // { x: 2, y: 2 }, // FREE cell - automatically open
        { x: 3, y: 2 },
        { x: 4, y: 2 },
      ]);

      const result = detectCompletedLines(playerBoard);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(LineType.ROW);
      expect(result[0].index).toBe(2);
    });
  });

  describe("Column completion", () => {
    it.each([
      0, 1, 2, 3, 4,
    ])("should detect completed column %i", (colIndex) => {
      const playerBoard = createTestPlayerBoard();

      // Open all cells in the specified column
      const positions = Array.from({ length: BOARD_SIZE }, (_, y) => ({
        x: colIndex,
        y,
      }));
      openCellsAtPositions(playerBoard, positions);

      const result = detectCompletedLines(playerBoard);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: LineType.COLUMN,
        index: colIndex,
      });
      expect(result[0].completedAt).toBeInstanceOf(Date);
    });

    it("should detect column 2 (middle column with FREE cell)", () => {
      const playerBoard = createTestPlayerBoard();

      // Column 2 contains the FREE cell at (2, 2)
      // Open all non-FREE cells in column 2
      openCellsAtPositions(playerBoard, [
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        // { x: 2, y: 2 }, // FREE cell - automatically open
        { x: 2, y: 3 },
        { x: 2, y: 4 },
      ]);

      const result = detectCompletedLines(playerBoard);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(LineType.COLUMN);
      expect(result[0].index).toBe(2);
    });
  });

  describe("Diagonal completion", () => {
    it("should detect main diagonal (top-left to bottom-right)", () => {
      const playerBoard = createTestPlayerBoard();

      // Main diagonal: (0,0), (1,1), (2,2), (3,3), (4,4)
      // (2,2) is FREE cell
      openCellsAtPositions(playerBoard, [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        // { x: 2, y: 2 }, // FREE cell
        { x: 3, y: 3 },
        { x: 4, y: 4 },
      ]);

      const result = detectCompletedLines(playerBoard);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: LineType.DIAGONAL,
        index: 0, // Main diagonal index
      });
    });

    it("should detect anti-diagonal (top-right to bottom-left)", () => {
      const playerBoard = createTestPlayerBoard();

      // Anti-diagonal: (4,0), (3,1), (2,2), (1,3), (0,4)
      // (2,2) is FREE cell
      openCellsAtPositions(playerBoard, [
        { x: 4, y: 0 },
        { x: 3, y: 1 },
        // { x: 2, y: 2 }, // FREE cell
        { x: 1, y: 3 },
        { x: 0, y: 4 },
      ]);

      const result = detectCompletedLines(playerBoard);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: LineType.DIAGONAL,
        index: 1, // Anti-diagonal index
      });
    });
  });

  describe("Multiple lines completion", () => {
    it("should detect multiple completed lines simultaneously", () => {
      const playerBoard = createTestPlayerBoard();

      // Complete top row (y=0)
      openCellsAtPositions(playerBoard, [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 4, y: 0 },
      ]);

      // Complete left column (x=0)
      openCellsAtPositions(playerBoard, [
        { x: 0, y: 0 }, // Already open
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 0, y: 3 },
        { x: 0, y: 4 },
      ]);

      const result = detectCompletedLines(playerBoard);

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(
        expect.objectContaining({
          type: LineType.ROW,
          index: 0,
        }),
      );
      expect(result).toContainEqual(
        expect.objectContaining({
          type: LineType.COLUMN,
          index: 0,
        }),
      );
    });

    it("should detect row + column + diagonal (3 lines through FREE cell)", () => {
      const playerBoard = createTestPlayerBoard();

      // Row 2 (middle row with FREE)
      openCellsAtPositions(playerBoard, [
        { x: 0, y: 2 },
        { x: 1, y: 2 },
        { x: 2, y: 2 }, // FREE
        { x: 3, y: 2 },
        { x: 4, y: 2 },
      ]);

      // Column 2 (middle column with FREE)
      openCellsAtPositions(playerBoard, [
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        { x: 2, y: 2 }, // FREE (already counted)
        { x: 2, y: 3 },
        { x: 2, y: 4 },
      ]);

      // Main diagonal
      openCellsAtPositions(playerBoard, [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 }, // FREE (already counted)
        { x: 3, y: 3 },
        { x: 4, y: 4 },
      ]);

      const result = detectCompletedLines(playerBoard);

      expect(result).toHaveLength(3);
      expect(result).toContainEqual(
        expect.objectContaining({
          type: LineType.ROW,
          index: 2,
        }),
      );
      expect(result).toContainEqual(
        expect.objectContaining({
          type: LineType.COLUMN,
          index: 2,
        }),
      );
      expect(result).toContainEqual(
        expect.objectContaining({
          type: LineType.DIAGONAL,
          index: 0,
        }),
      );
    });
  });

  describe("FREE cell behavior", () => {
    it("should treat FREE cell as always open", () => {
      const playerBoard = createTestPlayerBoard();

      // Find the FREE cell
      const freeCell = playerBoard.cells.find((c) => c.isFree);
      expect(freeCell).toBeDefined();
      expect(freeCell?.position).toEqual({
        x: BOARD_CENTER_COORD,
        y: BOARD_CENTER_COORD,
      });

      // FREE cell should not have a cellState entry (or it's ignored)
      expect(playerBoard.cellStates[freeCell?.id]).toBeUndefined();

      // Complete middle row (contains FREE cell)
      openCellsAtPositions(playerBoard, [
        { x: 0, y: BOARD_CENTER_COORD },
        { x: 1, y: BOARD_CENTER_COORD },
        // FREE cell at (2, 2) - automatically counted as open
        { x: 3, y: BOARD_CENTER_COORD },
        { x: 4, y: BOARD_CENTER_COORD },
      ]);

      const result = detectCompletedLines(playerBoard);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(LineType.ROW);
      expect(result[0].index).toBe(BOARD_CENTER_COORD);
    });
  });

  describe("Shuffle support", () => {
    it("should correctly detect lines on shuffled board", () => {
      const playerBoard = createShuffledPlayerBoard();

      // Verify that cells are shuffled (positions don't match original indices)
      const _firstCell = playerBoard.cells[0];
      // After shuffle, the first cell in array might not be at position (0, 0)

      // Find cells at specific positions and open them to form a line
      // Let's complete row 0 by finding all cells at y=0 and opening them
      const row0Cells = playerBoard.cells.filter((c) => c.position.y === 0);
      expect(row0Cells).toHaveLength(BOARD_SIZE);

      const row0CellIds = row0Cells.filter((c) => !c.isFree).map((c) => c.id);
      openCellsByIds(playerBoard, row0CellIds);

      const result = detectCompletedLines(playerBoard);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: LineType.ROW,
        index: 0,
      });
    });

    it("should detect diagonal on shuffled board", () => {
      const playerBoard = createShuffledPlayerBoard();

      // Complete main diagonal by position
      const diagonalPositions = Array.from({ length: BOARD_SIZE }, (_, i) => ({
        x: i,
        y: i,
      }));

      openCellsAtPositions(playerBoard, diagonalPositions);

      const result = detectCompletedLines(playerBoard);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: LineType.DIAGONAL,
        index: 0,
      });
    });

    it("should detect multiple lines on shuffled board", () => {
      const playerBoard = createShuffledPlayerBoard();

      // Complete row 1
      const row1Positions = Array.from({ length: BOARD_SIZE }, (_, x) => ({
        x,
        y: 1,
      }));
      openCellsAtPositions(playerBoard, row1Positions);

      // Complete column 3
      const col3Positions = Array.from({ length: BOARD_SIZE }, (_, y) => ({
        x: 3,
        y,
      }));
      openCellsAtPositions(playerBoard, col3Positions);

      const result = detectCompletedLines(playerBoard);

      // Should find both row 1 and column 3
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(
        expect.objectContaining({
          type: LineType.ROW,
          index: 1,
        }),
      );
      expect(result).toContainEqual(
        expect.objectContaining({
          type: LineType.COLUMN,
          index: 3,
        }),
      );
    });
  });

  describe("Incomplete lines", () => {
    it("should not detect row with one cell missing", () => {
      const playerBoard = createTestPlayerBoard();

      // Open 4 out of 5 cells in row 0 (missing x=2)
      openCellsAtPositions(playerBoard, [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        // { x: 2, y: 0 }, // Missing
        { x: 3, y: 0 },
        { x: 4, y: 0 },
      ]);

      const result = detectCompletedLines(playerBoard);

      expect(result).toEqual([]);
    });

    it("should not detect diagonal with one cell missing", () => {
      const playerBoard = createTestPlayerBoard();

      // Open main diagonal except (1,1)
      openCellsAtPositions(playerBoard, [
        { x: 0, y: 0 },
        // { x: 1, y: 1 }, // Missing
        { x: 2, y: 2 }, // FREE
        { x: 3, y: 3 },
        { x: 4, y: 4 },
      ]);

      const result = detectCompletedLines(playerBoard);

      expect(result).toEqual([]);
    });

    it("should not detect column with FREE cell missing (if FREE logic broken)", () => {
      const playerBoard = createTestPlayerBoard();

      // This test verifies that FREE cell is properly handled
      // Open all cells in column 2 EXCEPT the FREE cell (2,2)
      // But FREE cells should be automatically treated as open
      openCellsAtPositions(playerBoard, [
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        // { x: 2, y: 2 }, // FREE cell - should be auto-open
        { x: 2, y: 3 },
        { x: 2, y: 4 },
      ]);

      const result = detectCompletedLines(playerBoard);

      // Should detect column 2 because FREE cell counts as open
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: LineType.COLUMN,
        index: 2,
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle empty cellStates object (all cells closed except FREE)", () => {
      const playerBoard = createTestPlayerBoard();
      playerBoard.cellStates = {}; // Reset all states

      const result = detectCompletedLines(playerBoard);

      // No lines should be detected (only FREE cell is open)
      expect(result).toEqual([]);
    });

    it("should handle all cells open (multiple lines)", () => {
      const playerBoard = createTestPlayerBoard();

      // Open all cells
      for (const cell of playerBoard.cells) {
        if (!cell.isFree) {
          playerBoard.cellStates[cell.id] = {
            isOpen: true,
            openedAt: new Date(),
          };
        }
      }

      const result = detectCompletedLines(playerBoard);

      // Should detect: 5 rows + 5 columns + 2 diagonals = 12 lines
      expect(result).toHaveLength(12);

      // Count line types
      const rowCount = result.filter(
        (line) => line.type === LineType.ROW,
      ).length;
      const colCount = result.filter(
        (line) => line.type === LineType.COLUMN,
      ).length;
      const diagCount = result.filter(
        (line) => line.type === LineType.DIAGONAL,
      ).length;

      expect(rowCount).toBe(5);
      expect(colCount).toBe(5);
      expect(diagCount).toBe(2);
    });
  });
});
