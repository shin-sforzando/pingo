import type { Meta, StoryObj } from "@storybook/react";
import { AnimatedGridPattern } from "./animated-grid-pattern";

const meta: Meta<typeof AnimatedGridPattern> = {
  title: "MagicUI/AnimatedGridPattern",
  component: AnimatedGridPattern,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof AnimatedGridPattern>;

export const Default: Story = {
  args: {
    width: 40,
    height: 40,
    numSquares: 50,
    maxOpacity: 0.5,
    duration: 4,
    repeatDelay: 0.5,
    className: "h-[400px] w-[600px]",
  },
};

export const WithMoreSquares: Story = {
  args: {
    width: 30,
    height: 30,
    numSquares: 100,
    maxOpacity: 0.5,
    duration: 4,
    repeatDelay: 0.5,
    className: "h-[400px] w-[600px]",
  },
  name: "More Squares",
  parameters: {
    docs: {
      description: {
        story:
          "Increases the number of squares to 100 for a more dynamic effect.",
      },
    },
  },
};

export const WithHigherOpacity: Story = {
  args: {
    width: 40,
    height: 40,
    numSquares: 50,
    maxOpacity: 0.8,
    duration: 4,
    repeatDelay: 0.5,
    className: "h-[400px] w-[600px]",
  },
  name: "Higher Opacity",
  parameters: {
    docs: {
      description: {
        story: "Increases the maximum opacity to 0.8 for more visible squares.",
      },
    },
  },
};

export const WithFasterAnimation: Story = {
  args: {
    width: 40,
    height: 40,
    numSquares: 50,
    maxOpacity: 0.5,
    duration: 2,
    repeatDelay: 0.2,
    className: "h-[400px] w-[600px]",
  },
  name: "Faster Animation",
  parameters: {
    docs: {
      description: {
        story:
          "Speeds up the animation by reducing the duration and repeat delay.",
      },
    },
  },
};

export const WithSmallerCells: Story = {
  args: {
    width: 20,
    height: 20,
    numSquares: 50,
    maxOpacity: 0.5,
    duration: 4,
    repeatDelay: 0.5,
    className: "h-[400px] w-[600px]",
  },
  name: "Smaller Cells",
  parameters: {
    docs: {
      description: {
        story: "Reduces the cell size to 20x20 for a denser grid pattern.",
      },
    },
  },
};

export const WithDashedLines: Story = {
  args: {
    width: 40,
    height: 40,
    numSquares: 50,
    maxOpacity: 0.5,
    duration: 4,
    repeatDelay: 0.5,
    strokeDasharray: "4 2",
    className: "h-[400px] w-[600px]",
  },
  name: "Dashed Lines",
  parameters: {
    docs: {
      description: {
        story: "Uses dashed lines for the grid pattern.",
      },
    },
  },
};

export const WithRadialMask: Story = {
  args: {
    width: 40,
    height: 40,
    numSquares: 50,
    maxOpacity: 0.5,
    duration: 4,
    repeatDelay: 0.5,
    className:
      "h-[400px] w-[600px] [mask-image:radial-gradient(400px_circle_at_center,white,transparent)]",
  },
  name: "Radial Mask",
  parameters: {
    docs: {
      description: {
        story: "Applies a radial gradient mask to create a circular effect.",
      },
    },
  },
};
