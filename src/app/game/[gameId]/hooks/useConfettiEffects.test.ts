import { LineType } from "@/types/common";
import type { CompletedLine } from "@/types/schema";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useConfettiEffects } from "./useConfettiEffects";

// Mock the confetti ref
const mockFire = vi.fn();
const mockRef = {
  current: {
    fire: mockFire,
  },
};

// Mock usePrevious hook
vi.mock("./usePrevious", () => ({
  usePrevious: vi.fn(),
}));

// Mock window.setInterval and clearInterval
const mockSetInterval = vi.fn();
const mockClearInterval = vi.fn();
vi.stubGlobal("setInterval", mockSetInterval);
vi.stubGlobal("clearInterval", mockClearInterval);

// Mock useRef
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useRef: vi.fn(() => mockRef),
  };
});

import { usePrevious } from "./usePrevious";

describe("useConfettiEffects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return confetti ref", () => {
    vi.mocked(usePrevious).mockReturnValue(undefined);

    const { result } = renderHook(() =>
      useConfettiEffects({
        completedLines: [],
        requiredBingoLines: 1,
      }),
    );

    expect(result.current).toBe(mockRef);
  });

  it("should trigger basic confetti when first line is completed", () => {
    // First render with no completed lines
    vi.mocked(usePrevious).mockReturnValue(undefined);

    const { rerender } = renderHook(
      ({ completedLines, requiredBingoLines }) =>
        useConfettiEffects({ completedLines, requiredBingoLines }),
      {
        initialProps: {
          completedLines: [] as CompletedLine[],
          requiredBingoLines: 2, // Set to 2 so first line doesn't trigger fireworks
        },
      },
    );

    // Second render with one completed line
    const completedLine: CompletedLine = {
      type: LineType.ROW,
      index: 0,
      completedAt: new Date(),
    };

    vi.mocked(usePrevious).mockReturnValue(0); // Previous count was 0

    rerender({
      completedLines: [completedLine],
      requiredBingoLines: 2,
    });

    expect(mockFire).toHaveBeenCalledWith({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#08d9d6", "#ff2e63", "#eaeaea"],
    });
  });

  it("should trigger fireworks confetti when required lines are completed", () => {
    // Previous state with one line
    const previousLine: CompletedLine = {
      type: LineType.ROW,
      index: 0,
      completedAt: new Date(),
    };
    vi.mocked(usePrevious).mockReturnValue(1); // Previous count was 1

    const { rerender } = renderHook(
      ({ completedLines, requiredBingoLines }) =>
        useConfettiEffects({ completedLines, requiredBingoLines }),
      {
        initialProps: {
          completedLines: [previousLine],
          requiredBingoLines: 2,
        },
      },
    );

    // Add second line to reach required count
    const secondLine: CompletedLine = {
      type: LineType.COLUMN,
      index: 1,
      completedAt: new Date(),
    };

    rerender({
      completedLines: [previousLine, secondLine],
      requiredBingoLines: 2,
    });

    // Should trigger basic confetti first
    expect(mockFire).toHaveBeenCalledWith({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#08d9d6", "#ff2e63", "#eaeaea"],
    });

    // Should trigger fireworks (setInterval should be called)
    expect(mockSetInterval).toHaveBeenCalled();
  });

  it("should not trigger confetti when lines decrease", () => {
    // Previous state with two lines
    const previousLines: CompletedLine[] = [
      { type: LineType.ROW, index: 0, completedAt: new Date() },
      { type: LineType.COLUMN, index: 1, completedAt: new Date() },
    ];
    vi.mocked(usePrevious).mockReturnValue(2); // Previous count was 2

    renderHook(() =>
      useConfettiEffects({
        completedLines: [previousLines[0]], // One line removed (count = 1)
        requiredBingoLines: 2,
      }),
    );

    expect(mockFire).not.toHaveBeenCalled();
  });

  it("should not trigger confetti when lines stay the same", () => {
    const completedLines: CompletedLine[] = [
      { type: LineType.ROW, index: 0, completedAt: new Date() },
    ];
    vi.mocked(usePrevious).mockReturnValue(1); // Previous count was 1, current is also 1

    renderHook(() =>
      useConfettiEffects({
        completedLines,
        requiredBingoLines: 2,
      }),
    );

    expect(mockFire).not.toHaveBeenCalled();
  });

  it("should trigger basic confetti for additional lines before reaching required count", () => {
    // Previous state with one line
    const previousLine: CompletedLine = {
      type: LineType.ROW,
      index: 0,
      completedAt: new Date(),
    };
    vi.mocked(usePrevious).mockReturnValue(1); // Previous count was 1

    const secondLine: CompletedLine = {
      type: LineType.COLUMN,
      index: 1,
      completedAt: new Date(),
    };

    renderHook(() =>
      useConfettiEffects({
        completedLines: [previousLine, secondLine],
        requiredBingoLines: 3, // Need 3 lines, so this is not the final
      }),
    );

    // Should trigger basic confetti for the new line
    expect(mockFire).toHaveBeenCalledWith({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#08d9d6", "#ff2e63", "#eaeaea"],
    });
  });

  it("should handle multiple new lines at once", () => {
    // Previous state with no lines
    vi.mocked(usePrevious).mockReturnValue(0); // Previous count was 0

    const completedLines: CompletedLine[] = [
      { type: LineType.ROW, index: 0, completedAt: new Date() },
      { type: LineType.COLUMN, index: 1, completedAt: new Date() },
    ];

    renderHook(() =>
      useConfettiEffects({
        completedLines,
        requiredBingoLines: 3,
      }),
    );

    // Should trigger confetti once (the effect only triggers once per render)
    expect(mockFire).toHaveBeenCalledTimes(1);
    expect(mockFire).toHaveBeenCalledWith({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#08d9d6", "#ff2e63", "#eaeaea"],
    });
  });

  it("should trigger fireworks when exactly reaching required lines", () => {
    // Previous state with 2 lines
    const previousLines: CompletedLine[] = [
      { type: LineType.ROW, index: 0, completedAt: new Date() },
      { type: LineType.COLUMN, index: 1, completedAt: new Date() },
    ];
    vi.mocked(usePrevious).mockReturnValue(2); // Previous count was 2

    const thirdLine: CompletedLine = {
      type: LineType.DIAGONAL,
      index: 0,
      completedAt: new Date(),
    };

    renderHook(() =>
      useConfettiEffects({
        completedLines: [...previousLines, thirdLine],
        requiredBingoLines: 3, // Exactly reaching required count
      }),
    );

    // Should trigger basic confetti first
    expect(mockFire).toHaveBeenCalledWith({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#08d9d6", "#ff2e63", "#eaeaea"],
    });

    // Should trigger fireworks (setInterval should be called)
    expect(mockSetInterval).toHaveBeenCalled();
  });
});
