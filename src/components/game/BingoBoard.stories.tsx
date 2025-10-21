import { fakerJA as faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { BOARD_SIZE, CENTER_CELL_INDEX, NON_FREE_CELLS } from "@/lib/constants";
import type { Cell } from "@/types/schema";
import { BingoBoard } from "./BingoBoard";
import type { BingoCellState } from "./BingoCell";

const meta = {
  title: "Game/BingoBoard",
  component: BingoBoard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    onCellClick: { action: "cell clicked" },
  },
} satisfies Meta<typeof BingoBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Generate sample cells for a BOARD_SIZE x BOARD_SIZE board
const generateSampleCells = (): Cell[] => {
  const cells: Cell[] = [];
  const subjects = faker.helpers.multiple(() => faker.lorem.word(), {
    count: NON_FREE_CELLS,
  });

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const index = y * BOARD_SIZE + x;
      const isFree = index === CENTER_CELL_INDEX; // Center cell is FREE

      cells.push({
        id: `cell-${index}`,
        position: { x, y },
        subject: isFree
          ? "FREE"
          : subjects[CENTER_CELL_INDEX < index ? index - 1 : index],
        isFree,
      });
    }
  }

  return cells;
};

// Sample cell states
const generateSampleCellStates = (
  pattern: "none" | "random" | "row" | "column" | "diagonal" | "all",
): Record<string, BingoCellState> => {
  const states: Record<string, BingoCellState> = {};

  for (let i = 0; i < 25; i++) {
    const cellId = `cell-${i}`;

    if (i === 12) {
      // Center is always FREE
      states[cellId] = "FREE";
      continue;
    }

    switch (pattern) {
      case "none":
        states[cellId] = "CLOSE";
        break;
      case "random":
        states[cellId] = 0.5 < Math.random() ? "OPEN" : "CLOSE";
        break;
      case "row":
        // Open the middle row (cells 10-14)
        states[cellId] = 10 <= i && i < 15 ? "OPEN" : "CLOSE";
        break;
      case "column":
        // Open the middle column (cells 2, 7, 12, 17, 22)
        states[cellId] = i % 5 === 2 ? "OPEN" : "CLOSE";
        break;
      case "diagonal":
        // Open the main diagonal (cells 0, 6, 12, 18, 24)
        states[cellId] = i % 6 === 0 ? "OPEN" : "CLOSE";
        break;
      case "all":
        states[cellId] = "OPEN";
        break;
    }
  }

  return states;
};

// Generate completed lines based on pattern
const generateCompletedLines = (
  pattern: "none" | "row" | "column" | "diagonal" | "multiple",
): number[][] => {
  switch (pattern) {
    case "row":
      // Middle row (indices 10-14)
      return [[10, 11, 12, 13, 14]];
    case "column":
      // Middle column (indices 2, 7, 12, 17, 22)
      return [[2, 7, 12, 17, 22]];
    case "diagonal":
      // Main diagonal (indices 0, 6, 12, 18, 24)
      return [[0, 6, 12, 18, 24]];
    case "multiple":
      // Multiple lines
      return [
        [0, 1, 2, 3, 4], // Top row
        [0, 6, 12, 18, 24], // Main diagonal
      ];
    default:
      return [];
  }
};

// Basic board
export const Default: Story = {
  args: {
    cells: generateSampleCells(),
  },
};

// With some cells open
export const WithOpenCells: Story = {
  args: {
    cells: generateSampleCells(),
    cellStates: generateSampleCellStates("random"),
  },
};

// With a completed row
export const CompletedRow: Story = {
  args: {
    cells: generateSampleCells(),
    cellStates: generateSampleCellStates("row"),
    completedLines: generateCompletedLines("row"),
  },
};

// With a completed column
export const CompletedColumn: Story = {
  args: {
    cells: generateSampleCells(),
    cellStates: generateSampleCellStates("column"),
    completedLines: generateCompletedLines("column"),
  },
};

// With a completed diagonal
export const CompletedDiagonal: Story = {
  args: {
    cells: generateSampleCells(),
    cellStates: generateSampleCellStates("diagonal"),
    completedLines: generateCompletedLines("diagonal"),
  },
};

// With multiple completed lines
export const MultipleCompletedLines: Story = {
  args: {
    cells: generateSampleCells(),
    cellStates: generateSampleCellStates("all"),
    completedLines: generateCompletedLines("multiple"),
  },
};

// Interactive board
export const Interactive: Story = {
  args: {
    cells: generateSampleCells(),
    cellStates: generateSampleCellStates("random"),
    onCellClick: (cellId) => console.log(`Cell ${cellId} clicked`),
  },
};

// Responsive display
export const Responsive: Story = {
  args: {
    cells: generateSampleCells(),
    cellStates: generateSampleCellStates("random"),
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

// With fewer than 25 cells (should auto-fill)
export const FewerCells: Story = {
  args: {
    cells: generateSampleCells().slice(0, 15),
  },
};

// With custom styling
export const CustomStyling: Story = {
  args: {
    cells: generateSampleCells(),
    cellStates: generateSampleCellStates("random"),
    className: "bg-muted p-4 rounded-xl",
  },
};
