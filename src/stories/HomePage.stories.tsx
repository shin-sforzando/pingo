import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "@storybook/test";

import Home from "@/app/page";
import { waitFor } from "@testing-library/dom";

const meta = {
  title: "Page/HomePage",
  component: Home,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Home>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const getStarted = canvas.getByText(/Get started by editing/i);
    await waitFor(() => {
      expect(getStarted).toBeInTheDocument();
    });
  },
};
