import type { Meta, StoryObj } from "@storybook/nextjs";
import { useId } from "react";
import { Input } from "./input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "password", "email", "number", "date", "tel", "url"],
    },
    disabled: {
      control: "boolean",
    },
    placeholder: {
      control: "text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: "Enter text here",
  },
};

export const WithValue: Story = {
  args: {
    value: "Input with value",
    readOnly: true,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Disabled input",
    disabled: true,
  },
};

export const WithError: Story = {
  render: () => (
    <div className="space-y-2">
      <Input aria-invalid placeholder="Input with error" />
      <p className="text-destructive text-sm">This field is required.</p>
    </div>
  ),
};

export const Password: Story = {
  args: {
    type: "password",
    placeholder: "Enter password",
  },
};

export const NumberInput: Story = {
  args: {
    type: "number",
    placeholder: "Enter number",
  },
};

export const DateInput: Story = {
  args: {
    type: "date",
  },
};

export const Email: Story = {
  args: {
    type: "email",
    placeholder: "Enter email address",
  },
};

export const WithLabel: Story = {
  render: () => {
    const id = useId();
    return (
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <label htmlFor={id} className="font-medium text-sm">
          Email
        </label>
        <Input id={id} placeholder="Enter your email" />
      </div>
    );
  },
};

export const WithLabelAndDescription: Story = {
  render: () => {
    const id = useId();
    return (
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <label htmlFor={id} className="font-medium text-sm">
          Username
        </label>
        <Input id={id} placeholder="Enter username" />
        <p className="text-muted-foreground text-sm">
          This will be your public display name.
        </p>
      </div>
    );
  },
};

export const InputSizes: Story = {
  render: () => (
    <div className="flex flex-col space-y-4">
      <Input placeholder="Default size" />
      <Input placeholder="Small size" className="h-8 text-sm" />
      <Input placeholder="Large size" className="h-10 text-lg" />
    </div>
  ),
};
