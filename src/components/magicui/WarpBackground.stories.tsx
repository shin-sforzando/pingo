import type { Meta, StoryObj } from "@storybook/react";
import { WarpBackground } from "./warp-background";

const meta: Meta<typeof WarpBackground> = {
  title: "MagicUI/WarpBackground",
  component: WarpBackground,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof WarpBackground>;

// Sample content component for demonstration
const SampleContent = (): React.ReactElement => (
  <div className="w-80 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
    <h3 className="text-xl font-bold mb-2">Pingo</h3>
    <p className="text-gray-600 dark:text-gray-300">
      A bingo game with AI-based photo judgment
    </p>
  </div>
);

export const Default: Story = {
  args: {
    children: <SampleContent />,
  },
};

export const WithCustomPerspective: Story = {
  args: {
    children: <SampleContent />,
    perspective: 200,
  },
  name: "Custom Perspective",
  parameters: {
    docs: {
      description: {
        story: "Sets the perspective value to 200 for a stronger 3D effect.",
      },
    },
  },
};

export const WithMoreBeams: Story = {
  args: {
    children: <SampleContent />,
    beamsPerSide: 6,
    beamDelayMin: 0.2,
    beamDelayMax: 2,
  },
  name: "Increased Beam Count",
  parameters: {
    docs: {
      description: {
        story:
          "Increases the number of beams per side to 6 for a more dynamic effect.",
      },
    },
  },
};

export const WithCustomColors: Story = {
  args: {
    children: <SampleContent />,
    gridColor: "rgba(59, 130, 246, 0.5)", // Blue-ish color
  },
  name: "Custom Grid Color",
  parameters: {
    docs: {
      description: {
        story: "Changes the grid color to a blue shade.",
      },
    },
  },
};

export const WithFasterAnimation: Story = {
  args: {
    children: <SampleContent />,
    beamDuration: 1.5,
    beamDelayMin: 0,
    beamDelayMax: 1,
  },
  name: "Fast Animation",
  parameters: {
    docs: {
      description: {
        story:
          "Speeds up the beam animation for a more energetic visual effect.",
      },
    },
  },
};

export const WithLargerBeams: Story = {
  args: {
    children: <SampleContent />,
    beamSize: 10,
  },
  name: "Large Beams",
  parameters: {
    docs: {
      description: {
        story:
          "Increases the beam size to 10 for more prominent visual elements.",
      },
    },
  },
};

export const FullscreenExample: Story = {
  args: {
    children: (
      <div className="flex items-center justify-center h-[400px] w-[600px]">
        <h1 className="text-3xl font-bold text-white">Pingo</h1>
      </div>
    ),
    className: "h-[400px] w-[600px] p-0 border-0",
  },
  name: "Fullscreen Background",
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates using WarpBackground as a fullscreen background element.",
      },
    },
  },
};
