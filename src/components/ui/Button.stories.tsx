import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import {
  ArrowRight,
  Check,
  Download,
  LoaderCircle,
  Mail,
  Plus,
  Trash,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The Button component is used to trigger an action or event, such as submitting a form, opening a dialog, canceling an action, or performing a delete operation.
 */
const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs", "shadcn/ui"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: { type: "select" },
      options: [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
      ],
      description: "The visual style of the button",
    },
    size: {
      control: { type: "select" },
      options: ["default", "sm", "lg", "icon"],
      description: "The size of the button",
    },
    asChild: {
      control: { type: "boolean" },
      description: "Whether to render the button as a child element",
    },
    disabled: {
      control: { type: "boolean" },
      description: "Whether the button is disabled",
    },
  },
  args: {
    onClick: fn(),
    children: "Button",
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

/**
 * The default button style.
 */
export const Default: Story = {
  args: {
    variant: "default",
    size: "default",
  },
};

/**
 * Used for destructive actions such as delete.
 */
export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Delete",
  },
};

/**
 * Button with an outline style.
 */
export const Outline: Story = {
  args: {
    variant: "outline",
  },
};

/**
 * Secondary button style.
 */
export const Secondary: Story = {
  args: {
    variant: "secondary",
  },
};

/**
 * Ghost button with no background.
 */
export const Ghost: Story = {
  args: {
    variant: "ghost",
  },
};

/**
 * Link styled as a button.
 */
export const Link: Story = {
  args: {
    variant: "link",
  },
};

/**
 * Small sized button.
 */
export const Small: Story = {
  args: {
    size: "sm",
  },
};

/**
 * Large sized button.
 */
export const Large: Story = {
  args: {
    size: "lg",
  },
};

/**
 * Button with an icon.
 */
export const WithIcon: Story = {
  args: {
    children: (
      <>
        Next <ArrowRight />
      </>
    ),
  },
};

/**
 * Button with an icon on the left.
 */
export const WithLeadingIcon: Story = {
  args: {
    children: (
      <>
        <Mail /> Email
      </>
    ),
  },
};

/**
 * Icon only button.
 */
export const IconButton: Story = {
  args: {
    size: "icon",
    "aria-label": "Add item",
    children: <Plus />,
  },
};

/**
 * Disabled button state.
 */
export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

/**
 * Destructive button with an icon.
 */
export const DestructiveWithIcon: Story = {
  args: {
    variant: "destructive",
    children: (
      <>
        <Trash /> Delete
      </>
    ),
  },
};

/**
 * Secondary button with an icon.
 */
export const SecondaryWithIcon: Story = {
  args: {
    variant: "secondary",
    children: (
      <>
        <Download /> Download
      </>
    ),
  },
};

/**
 * Outline button with an icon.
 */
export const OutlineWithIcon: Story = {
  args: {
    variant: "outline",
    children: (
      <>
        <Check /> Confirm
      </>
    ),
  },
};

/**
 * Loading state example.
 */
export const Loading: Story = {
  args: {
    disabled: true,
    children: (
      <>
        <LoaderCircle className="animate-spin" />
        Processing...
      </>
    ),
  },
};

/**
 * All button variants in a group.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

/**
 * All button sizes in a group.
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <Plus />
      </Button>
    </div>
  ),
};
