import type { Meta, StoryObj } from "@storybook/react";
import { ShineBorder } from "./shine-border";

const meta = {
  title: "MagicUI/ShineBorder",
  component: ShineBorder,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    borderWidth: {
      control: { type: "range", min: 1, max: 10, step: 1 },
      description: "Width of the border in pixels",
    },
    duration: {
      control: { type: "range", min: 1, max: 20, step: 1 },
      description: "Duration of the animation in seconds",
    },
    shineColor: {
      control: "color",
      description: "Color of the border",
    },
  },
  decorators: [
    (Story) => (
      <div className="relative flex h-64 w-64 items-center justify-center rounded-xl border">
        <Story />
        <div className="z-10 text-center">
          <h3 className="font-semibold text-lg">Shine Border</h3>
          <p className="text-muted-foreground text-sm">Hover to see effect</p>
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof ShineBorder>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    borderWidth: 1,
    duration: 14,
    shineColor: "#000000",
  },
};

// Different border widths
export const ThinBorder: Story = {
  args: {
    borderWidth: 1,
    duration: 14,
    shineColor: "#3b82f6",
  },
};

export const MediumBorder: Story = {
  args: {
    borderWidth: 3,
    duration: 14,
    shineColor: "#3b82f6",
  },
};

export const ThickBorder: Story = {
  args: {
    borderWidth: 6,
    duration: 14,
    shineColor: "#3b82f6",
  },
};

// Different animation speeds
export const FastAnimation: Story = {
  args: {
    borderWidth: 2,
    duration: 3,
    shineColor: "#3b82f6",
  },
};

export const MediumAnimation: Story = {
  args: {
    borderWidth: 2,
    duration: 8,
    shineColor: "#3b82f6",
  },
};

export const SlowAnimation: Story = {
  args: {
    borderWidth: 2,
    duration: 20,
    shineColor: "#3b82f6",
  },
};

// Different colors
export const BlueColor: Story = {
  args: {
    borderWidth: 2,
    duration: 8,
    shineColor: "#3b82f6",
  },
};

export const GreenColor: Story = {
  args: {
    borderWidth: 2,
    duration: 8,
    shineColor: "#10b981",
  },
};

export const PurpleColor: Story = {
  args: {
    borderWidth: 2,
    duration: 8,
    shineColor: "#8b5cf6",
  },
};

// Multiple colors
export const MultipleColors: Story = {
  args: {
    borderWidth: 2,
    duration: 8,
    shineColor: ["#3b82f6", "#10b981", "#8b5cf6"],
  },
};

export const RainbowColors: Story = {
  args: {
    borderWidth: 3,
    duration: 5,
    shineColor: [
      "#ef4444",
      "#f59e0b",
      "#10b981",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
    ],
  },
};
