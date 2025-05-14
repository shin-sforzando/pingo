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

  return (
    <div
      className={cn(
        "flex aspect-square w-full items-center justify-center rounded-md border p-1 text-center text-xs transition-all sm:text-sm md:p-2 md:text-base",
        // Base styles based on state
        state === "CLOSE" && "bg-card text-card-foreground",
        state === "OPEN" && "bg-primary text-primary-foreground",
        state === "FREE" && "bg-secondary text-secondary-foreground",
        // Highlight completed line
        isPartOfCompletedLine && "ring-2 ring-accent",
        // Interactive styles
        isInteractive && "cursor-pointer hover:opacity-90",
        // Custom class name
        className,
      )}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      role={isInteractive ? "button" : "cell"}
      tabIndex={isInteractive ? 0 : undefined}
    >
      <span className="line-clamp-3 break-words">
        {state === "FREE" ? "FREE" : cell.subject}
      </span>
    </div>
  );
}
