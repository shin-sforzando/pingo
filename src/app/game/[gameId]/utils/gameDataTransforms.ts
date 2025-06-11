import type { BingoCellState } from "@/components/game/BingoCell";
import type { CellState, CompletedLine } from "@/types/schema";

/**
 * Converts raw player board cell states to BingoBoard component format
 * Transforms database format to UI component expected format
 */
export function convertCellStatesToBingoFormat(
  rawCellStates: Record<string, CellState>,
): Record<string, BingoCellState> {
  const cellStates: Record<string, BingoCellState> = {};

  for (const [cellId, state] of Object.entries(rawCellStates)) {
    cellStates[cellId] = state.isOpen ? "OPEN" : "CLOSE";
  }

  return cellStates;
}

/**
 * Converts completed lines data to cell indices for BingoBoard highlighting
 * Transforms line metadata to visual grid positions for UI rendering
 */
export function convertCompletedLinesToIndices(
  completedLines: CompletedLine[],
): number[][] {
  return completedLines.map((line) => {
    const indices: number[] = [];

    if (line.type === "row") {
      // Row: indices are consecutive within the row
      for (let x = 0; x < 5; x++) {
        indices.push(line.index * 5 + x);
      }
    } else if (line.type === "column") {
      // Column: indices are spaced by 5 (grid width)
      for (let y = 0; y < 5; y++) {
        indices.push(y * 5 + line.index);
      }
    } else if (line.type === "diagonal") {
      if (line.index === 0) {
        // Main diagonal (top-left to bottom-right)
        for (let i = 0; i < 5; i++) {
          indices.push(i * 5 + i);
        }
      } else {
        // Anti-diagonal (top-right to bottom-left)
        for (let i = 0; i < 5; i++) {
          indices.push(i * 5 + (4 - i));
        }
      }
    }

    return indices;
  });
}

/**
 * Finds the latest submission from submissions array
 * Assumes submissions are ordered by submission time (newest first)
 */
export function getLatestSubmission<T>(submissions: T[]): T | null {
  return 0 < submissions.length ? submissions[0] : null;
}

/**
 * Finds matched cell subject by cell ID from game board
 * Used to display human-readable cell content in submission results
 */
export function findMatchedCellSubject(
  cellId: string | null | undefined,
  gameBoard: Array<{ id: string; subject: string }> | null,
): string | null {
  if (!cellId || !gameBoard) return null;

  const cell = gameBoard.find((cell) => cell.id === cellId);
  return cell?.subject || null;
}
