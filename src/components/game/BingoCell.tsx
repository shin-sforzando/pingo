"use client";

import { cn } from "@/lib/utils";
import type { Cell } from "@/types/schema";

export type BingoCellState = "CLOSE" | "OPEN" | "FREE";

export interface BingoCellProps {
  /**
   * Cell data
   */
  cell: Cell;
  /**
   * Cell state
   */
  state?: BingoCellState;
  /**
   * Optional CSS class name
   */
  className?: string;
  /**
   * Optional click handler
   */
  onClick?: () => void;
  /**
   * Whether the cell is part of a completed line
   */
  isPartOfCompletedLine?: boolean;
}

/**
 * BingoCell component
 *
 * Represents a single cell in a bingo board.
 * Can be in one of three states: CLOSE, OPEN, or FREE.
 */
export function BingoCell({
  cell,
  state = "CLOSE",
  className,
  onClick,
  isPartOfCompletedLine = false,
}: BingoCellProps) {
  // Determine if the cell is interactive (has onClick handler)
  const isInteractive = Boolean(onClick);

  // Common classes for both interactive and non-interactive cells
  const commonClasses = cn(
    "flex aspect-square w-full items-center justify-center rounded-md border p-1 text-center text-xs transition-all sm:text-sm md:p-2 md:text-base",
    // Base styles based on state
    state === "CLOSE" && "bg-card text-card-foreground",
    state === "OPEN" && "bg-primary text-primary-foreground",
    state === "FREE" && "bg-secondary text-secondary-foreground",
    // Highlight completed line
    isPartOfCompletedLine && "ring-2 ring-accent",
    // Custom class name
    className,
  );

  const content = (
    <span className="line-clamp-3 break-words">
      {state === "FREE" ? "FREE" : cell.subject}
    </span>
  );

  // Use button element for interactive cells to satisfy a11y requirements
  if (isInteractive) {
    return (
      <button
        type="button"
        className={cn(commonClasses, "cursor-pointer hover:opacity-90")}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  // Use div element with role="cell" for non-interactive cells
  // Note: Not using <td> because BingoCell is used in CSS Grid, not HTML table
  return (
    // biome-ignore lint/a11y/useSemanticElements: BingoCell is used in CSS Grid layout, not HTML table
    <div className={commonClasses} role="cell">
      {content}
    </div>
  );
}
