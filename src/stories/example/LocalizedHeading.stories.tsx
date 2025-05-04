import type { Meta, StoryObj } from "@storybook/react";
import LocalizedHeading from "./LocalizedHeading";

/**
 * This component demonstrates the use of next-intl translations in Storybook.
 * You can switch between languages using the locale selector in the Storybook toolbar.
 */
const meta: Meta<typeof LocalizedHeading> = {
  title: "Example/LocalizedHeading",
  component: LocalizedHeading,
  tags: ["autodocs", "example"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["small", "medium", "large"],
      description: "The size of the heading",
    },
  },
};

export default meta;
type Story = StoryObj<typeof LocalizedHeading>;

/**
 * Small heading
 */
export const Small: Story = {
  args: {
    size: "small",
  },
};

/**
 * Medium heading
 */
export const Medium: Story = {
  args: {
    size: "medium",
  },
};

/**
 * Large heading
 */
export const Large: Story = {
  args: {
    size: "large",
  },
};
