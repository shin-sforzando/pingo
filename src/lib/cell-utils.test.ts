import { describe, expect, it } from "vitest";
import type { Cell } from "@/types/schema";
import { getCellSubject, resolveCellId } from "./cell-utils";

describe("resolveCellId", () => {
  const mockCells: Cell[] = [
    { id: "cell-1", subject: "リンゴ", isFree: false },
    { id: "cell-2", subject: "バナナ", isFree: false },
    { id: "cell-3", subject: "牛乳", isFree: false },
  ];

  it('should return cell ID when input starts with "cell"', () => {
    const result = resolveCellId("cell-1", mockCells);
    expect(result).toBe("cell-1");
  });

  it("should resolve subject name to cell ID", () => {
    const result = resolveCellId("牛乳", mockCells);
    expect(result).toBe("cell-3");
  });

  it("should resolve when cell ID exactly matches", () => {
    // Why: Handle case where availableCells contains the exact cell ID
    const result = resolveCellId("cell-2", mockCells);
    expect(result).toBe("cell-2");
  });

  it("should return null when subject not found", () => {
    const result = resolveCellId("存在しない被写体", mockCells);
    expect(result).toBeNull();
  });

  it("should return null when input is null", () => {
    const result = resolveCellId(null, mockCells);
    expect(result).toBeNull();
  });

  it("should handle empty availableCells array", () => {
    const result = resolveCellId("リンゴ", []);
    expect(result).toBeNull();
  });

  it("should match subject case-sensitively", () => {
    // Why: Japanese text should match exactly
    const result = resolveCellId("りんご", mockCells);
    expect(result).toBeNull();
  });

  it("should match by subject when cellId looks like a subject", () => {
    // Why: LLM might return subject name instead of cell ID
    const result = resolveCellId("リンゴ", mockCells);
    expect(result).toBe("cell-1");
  });

  it("should handle partial cell ID prefix", () => {
    // Why: Ensure only complete "cell" prefix is recognized
    const result = resolveCellId("cel-invalid", mockCells);
    expect(result).toBeNull();
  });
});

describe("getCellSubject", () => {
  const mockCells: Cell[] = [
    { id: "cell-1", subject: "リンゴ", isFree: false },
    { id: "cell-2", subject: "バナナ", isFree: false },
    { id: "cell-3", subject: "牛乳", isFree: false },
  ];

  it("should return subject for valid cell ID", () => {
    const result = getCellSubject("cell-1", mockCells);
    expect(result).toBe("リンゴ");
  });

  it("should return null for invalid cell ID", () => {
    const result = getCellSubject("cell-999", mockCells);
    expect(result).toBeNull();
  });

  it("should return null when cellId is null", () => {
    const result = getCellSubject(null, mockCells);
    expect(result).toBeNull();
  });

  it("should handle empty cells array", () => {
    const result = getCellSubject("cell-1", []);
    expect(result).toBeNull();
  });

  it("should return correct subject for multiple cells", () => {
    const result1 = getCellSubject("cell-1", mockCells);
    const result2 = getCellSubject("cell-2", mockCells);
    const result3 = getCellSubject("cell-3", mockCells);

    expect(result1).toBe("リンゴ");
    expect(result2).toBe("バナナ");
    expect(result3).toBe("牛乳");
  });

  it("should return subject for FREE cell", () => {
    const cellsWithFree: Cell[] = [
      ...mockCells,
      { id: "cell-free", subject: "FREE", isFree: true },
    ];
    const result = getCellSubject("cell-free", cellsWithFree);
    expect(result).toBe("FREE");
  });
});
