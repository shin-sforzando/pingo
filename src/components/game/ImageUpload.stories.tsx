import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ImageUpload } from "./ImageUpload";

const meta = {
  title: "Game/ImageUpload",
  component: ImageUpload,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "ImageUpload component for handling image selection, processing, and upload. Supports drag & drop, file validation, and client-side image processing with automatic JPEG conversion and resizing.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    onImageProcessed: {
      description: "Callback when image is successfully processed",
    },
    onUploadStart: {
      description: "Callback when upload process starts",
    },
    onUploadComplete: {
      description: "Callback when upload process completes (success or error)",
    },
    isUploading: {
      control: "boolean",
      description: "Whether the upload is currently in progress",
    },
    disabled: {
      control: "boolean",
      description: "Whether the component is disabled",
    },
    className: {
      control: "text",
      description: "Optional CSS class name",
    },
  },
  args: {
    onImageProcessed: fn(),
    onUploadStart: fn(),
    onUploadComplete: fn(),
  },
} satisfies Meta<typeof ImageUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state of the ImageUpload component.
 * Shows the drop zone with instructions for users to select or drop an image.
 */
export const Default: Story = {
  args: {
    isUploading: false,
    disabled: false,
  },
};

/**
 * Disabled state of the ImageUpload component.
 * The component is non-interactive and shows visual feedback that it's disabled.
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    isUploading: false,
  },
};

/**
 * Uploading state of the ImageUpload component.
 * Shows the component when an upload is in progress.
 */
export const Uploading: Story = {
  args: {
    isUploading: true,
    disabled: false,
  },
};

/**
 * ImageUpload component with custom styling.
 * Demonstrates how to apply custom CSS classes.
 */
export const WithCustomStyling: Story = {
  args: {
    className: "max-w-md border-2 border-blue-200 rounded-xl p-4",
    isUploading: false,
    disabled: false,
  },
};

/**
 * Interactive example showing all callback functions.
 * This story demonstrates the component's behavior with all event handlers.
 */
export const Interactive: Story = {
  args: {
    isUploading: false,
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Try uploading an image to see the processing and upload flow. The callbacks are handled by Storybook's action logger.",
      },
    },
  },
};

/**
 * Compact version of the ImageUpload component.
 * Shows how the component looks in a smaller container.
 */
export const Compact: Story = {
  args: {
    className: "max-w-sm",
    isUploading: false,
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: "ImageUpload component in a compact layout for smaller spaces.",
      },
    },
  },
};
