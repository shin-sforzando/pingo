"use client";

import { cn } from "@/lib/utils";
import type { Cell } from "@/types/schema";
import { BingoCell, type BingoCellState } from "./BingoCell";

export interface BingoBoardProps {
  /**
   * Array of cells for the board
   */
  cells: Cell[];
  /**
   * Map of cell states by cell ID
   */
  cellStates?: Record<string, BingoCellState>;
  /**
   * Array of completed line indices
   * Each item is an array of cell indices that form a completed line
   */
  completedLines?: number[][];
  /**
   * Optional CSS class name
   */
  className?: string;
  /**
   * Optional click handler for cells
   */
  onCellClick?: (cellId: string) => void;
}

/**
 * BingoBoard component
 *
 * Displays a 5x5 bingo board with cells.
 * Supports highlighting completed lines.
 */
export function BingoBoard({
  cells,
  cellStates = {},
  completedLines = [],
  className,
  onCellClick,
}: BingoBoardProps) {
  // Handle undefined or null cells
  if (!cells || !Array.isArray(cells)) {
    return (
      <div className={cn("grid grid-cols-5 gap-1 md:gap-2", className)}>
        <div className="col-span-5 text-center text-muted-foreground">
          No board data available
        </div>
      </div>
    );
  }

  // Ensure we have exactly 25 cells
  const boardCells = cells.slice(0, 25);

  // If we have fewer than 25 cells, fill the rest with empty cells
  while (boardCells.length < 25) {
    boardCells.push({
      id: `empty-${boardCells.length}`,
      position: {
        x: boardCells.length % 5,
        y: Math.floor(boardCells.length / 5),
      },
      subject: "",
      isFree: false,
    });
  }

  // Sort cells by position
  const sortedCells = [...boardCells].sort((a, b) => {
    if (a.position.y !== b.position.y) {
      return a.position.y - b.position.y;
    }
    return a.position.x - b.position.x;
  });

  // Create a flat array of all cell indices that are part of completed lines
  const completedCellIndices = completedLines.flat();

  // Check if a cell is part of a completed line
  const isCellInCompletedLine = (index: number) => {
    return completedCellIndices.includes(index);
  };

  // Get the state for a cell
  const getCellState = (cell: Cell, index: number): BingoCellState => {
    // Center cell (index 12) is always FREE
    if (index === 12 || cell.isFree) {
      return "FREE";
    }

    // Use provided state or default to CLOSE
    return cellStates[cell.id] || "CLOSE";
  };

  return (
    <div className={cn("grid grid-cols-5 gap-1 md:gap-2", className)}>
      {sortedCells.map((cell, index) => (
        <BingoCell
          key={cell.id}
          cell={cell}
          state={getCellState(cell, index)}
          isPartOfCompletedLine={isCellInCompletedLine(index)}
          onClick={onCellClick ? () => onCellClick(cell.id) : undefined}
        />
      ))}
    </div>
  );
}
