import { describe, expect, it } from "vitest";
import type { Cell } from "@/types/schema";
import { getCellSubject, resolveCellId } from "./cell-utils";

describe("resolveCellId", () => {
  const mockCells: Cell[] = [
    {
      id: "cell_1",
      subject: "リンゴ",
      isFree: false,
      position: { x: 0, y: 0 },
    },
    {
      id: "cell_2",
      subject: "バナナ",
      isFree: false,
      position: { x: 1, y: 0 },
    },
    { id: "cell_3", subject: "牛乳", isFree: false, position: { x: 2, y: 0 } },
  ];

  it('should return cell ID when input starts with "cell_" (correct format)', () => {
    const result = resolveCellId("cell_1", mockCells);
    expect(result).toBe("cell_1");
  });

  it('should normalize cell ID when input uses "cell-" (incorrect format)', () => {
    const result = resolveCellId("cell-1", mockCells);
    expect(result).toBe("cell_1");
  });

  it("should resolve subject name to cell ID", () => {
    const result = resolveCellId("牛乳", mockCells);
    expect(result).toBe("cell_3");
  });

  it("should resolve when cell ID exactly matches", () => {
    // Why: Handle case where availableCells contains the exact cell ID
    const result = resolveCellId("cell_2", mockCells);
    expect(result).toBe("cell_2");
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
    expect(result).toBe("cell_1");
  });

  it("should handle partial cell ID prefix", () => {
    // Why: Ensure only complete "cell" prefix is recognized
    const result = resolveCellId("cel-invalid", mockCells);
    expect(result).toBeNull();
  });
});

describe("getCellSubject", () => {
  const mockCells: Cell[] = [
    {
      id: "cell_1",
      subject: "リンゴ",
      isFree: false,
      position: { x: 0, y: 0 },
    },
    {
      id: "cell_2",
      subject: "バナナ",
      isFree: false,
      position: { x: 1, y: 0 },
    },
    { id: "cell_3", subject: "牛乳", isFree: false, position: { x: 2, y: 0 } },
  ];

  it("should return subject for valid cell ID", () => {
    const result = getCellSubject("cell_1", mockCells);
    expect(result).toBe("リンゴ");
  });

  it("should return null for invalid cell ID", () => {
    const result = getCellSubject("cell_999", mockCells);
    expect(result).toBeNull();
  });

  it("should return null when cellId is null", () => {
    const result = getCellSubject(null, mockCells);
    expect(result).toBeNull();
  });

  it("should handle empty cells array", () => {
    const result = getCellSubject("cell_1", []);
    expect(result).toBeNull();
  });

  it("should return correct subject for multiple cells", () => {
    const result1 = getCellSubject("cell_1", mockCells);
    const result2 = getCellSubject("cell_2", mockCells);
    const result3 = getCellSubject("cell_3", mockCells);

    expect(result1).toBe("リンゴ");
    expect(result2).toBe("バナナ");
    expect(result3).toBe("牛乳");
  });

  it("should return subject for FREE cell", () => {
    const cellsWithFree: Cell[] = [
      ...mockCells,
      {
        id: "cell_free",
        subject: "FREE",
        isFree: true,
        position: { x: 2, y: 2 },
      },
    ];
    const result = getCellSubject("cell_free", cellsWithFree);
    expect(result).toBe("FREE");
  });
});
