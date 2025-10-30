import { fakerJA as faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { BOARD_CENTER_COORD } from "@/lib/constants";
import { BingoCell } from "./BingoCell";

const meta = {
  title: "Game/BingoCell",
  component: BingoCell,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    state: {
      control: "select",
      options: ["CLOSE", "OPEN", "FREE"],
      description: "The state of the cell",
    },
    isPartOfCompletedLine: {
      control: "boolean",
      description: "Whether the cell is part of a completed line",
    },
    onClick: { action: "clicked" },
  },
} satisfies Meta<typeof BingoCell>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample cell data
const sampleCell = {
  id: "cell_1",
  position: { x: 0, y: 0 },
  subject: faker.lorem.word({ length: { min: 5, max: 20 } }),
  isFree: false,
};

const longTextCell = {
  id: "cell_2",
  position: { x: 1, y: 0 },
  subject:
    "A very long subject that should be truncated after three lines of text",
  isFree: false,
};

const freeCell = {
  id: "cell_3",
  position: { x: BOARD_CENTER_COORD, y: BOARD_CENTER_COORD },
  subject: "FREE",
  isFree: true,
};

// Basic states
export const Default: Story = {
  args: {
    cell: sampleCell,
    state: "CLOSE",
  },
};

export const Open: Story = {
  args: {
    cell: sampleCell,
    state: "OPEN",
  },
};

export const Free: Story = {
  args: {
    cell: freeCell,
    state: "FREE",
  },
};

// With long text
export const LongText: Story = {
  args: {
    cell: longTextCell,
    state: "CLOSE",
  },
};

// Interactive
export const Interactive: Story = {
  args: {
    cell: sampleCell,
    state: "CLOSE",
    onClick: () => alert("Cell clicked!"),
  },
};

// Part of completed line
export const CompletedLine: Story = {
  args: {
    cell: sampleCell,
    state: "OPEN",
    isPartOfCompletedLine: true,
  },
};

// Different sizes
export const Small: Story = {
  args: {
    cell: sampleCell,
    state: "CLOSE",
    className: "w-16 h-16",
  },
};

export const Large: Story = {
  args: {
    cell: sampleCell,
    state: "CLOSE",
    className: "w-32 h-32",
  },
};
