import type { Meta, StoryObj } from "@storybook/react";
import { QRCodeCard } from "./QRCodeCard";

const meta = {
  title: "Game/QRCodeCard",
  component: QRCodeCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    gameId: { control: "text" },
    url: { control: "text" },
    size: { control: { type: "range", min: 100, max: 300, step: 10 } },
  },
} satisfies Meta<typeof QRCodeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    gameId: "ABCDEF",
    url: "https://example.com/game/ABCDEF",
    size: 200,
  },
};

export const WithCustomURL: Story = {
  args: {
    gameId: "TEST01",
    url: "https://example.com/game/TEST01",
    size: 200,
  },
};

export const LargeSize: Story = {
  args: {
    gameId: "PINGO1",
    url: "https://example.com/game/PINGO1",
    size: 300,
  },
};

export const SmallSize: Story = {
  args: {
    gameId: "PINGO2",
    url: "https://example.com/game/PINGO2",
    size: 150,
  },
};
