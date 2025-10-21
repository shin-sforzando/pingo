import type { Meta, StoryObj } from "@storybook/nextjs";
import { HyperText } from "./hyper-text";

const meta = {
  title: "MagicUI/HyperText",
  component: HyperText,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    duration: { control: { type: "number" } },
    delay: { control: { type: "number" } },
    startOnView: { control: { type: "boolean" } },
    animateOnHover: { control: { type: "boolean" } },
  },
} satisfies Meta<typeof HyperText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Hover Me!",
    className: "text-4xl font-bold",
  },
};

export const Loading: Story = {
  args: {
    children: "Loading...",
    className: "text-center font-bold text-4xl md:text-6xl",
    duration: 1200,
    animateOnHover: false,
    startOnView: true,
  },
};

export const CustomCharacterSet: Story = {
  args: {
    children: "Custom Characters",
    className: "text-3xl font-bold",
    characterSet: "0123456789!@#$%^&*()".split(""),
  },
};

export const SlowAnimation: Story = {
  args: {
    children: "Slow Animation",
    className: "text-3xl font-bold",
    duration: 2000,
  },
};

export const FastAnimation: Story = {
  args: {
    children: "Fast Animation",
    className: "text-3xl font-bold",
    duration: 500,
  },
};
