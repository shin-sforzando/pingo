import type { Cell } from "@/types/schema";

/**
 * Resolve matchedCellId to actual cell ID
 *
 * Gemini API sometimes returns subject name instead of cell ID.
 * This function handles the fallback: if matchedCellId looks like a subject name,
 * it searches for the cell with that subject and returns the actual cell ID.
 *
 * @param matchedCellId - The cell ID or subject name returned by Gemini
 * @param availableCells - List of cells to search from
 * @returns The resolved cell ID, or null if not found
 */
export function resolveCellId(
  matchedCellId: string | null,
  availableCells: Cell[],
): string | null {
  if (!matchedCellId) return null;

  // If it already looks like a cell ID, return as-is
  if (matchedCellId.startsWith("cell")) {
    return matchedCellId;
  }

  // Otherwise, treat it as a subject name and search for the cell
  console.log(
    "ℹ️ XXX: ~ cell-utils.ts ~ matchedCellId does not look like a cell ID, treating as subject name",
    { matchedCellId },
  );

  const matchedCell = availableCells.find(
    (cell) => cell.subject === matchedCellId || cell.id === matchedCellId,
  );

  if (matchedCell) {
    console.log("ℹ️ XXX: ~ cell-utils.ts ~ Found matching cell by subject", {
      originalMatchedCellId: matchedCellId,
      correctedCellId: matchedCell.id,
      subject: matchedCell.subject,
    });
    return matchedCell.id;
  }

  console.log("ℹ️ XXX: ~ cell-utils.ts ~ Could not find cell with subject", {
    matchedCellId,
  });
  return null;
}

/**
 * Get cell subject by cell ID
 *
 * @param cellId - The cell ID
 * @param cells - List of cells to search from
 * @returns The cell subject, or null if not found
 */
export function getCellSubject(
  cellId: string | null,
  cells: Cell[],
): string | null {
  if (!cellId) return null;

  const cell = cells.find((c) => c.id === cellId);
  return cell?.subject ?? null;
}
