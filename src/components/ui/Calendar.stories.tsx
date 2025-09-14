import type { Meta, StoryObj } from "@storybook/nextjs";
import { Calendar } from "./calendar";

const meta = {
  title: "UI/Calendar",
  component: Calendar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic calendar
export const Default: Story = {
  render: () => <Calendar />,
};

// Calendar with dropdown navigation
export const WithDropdown: Story = {
  render: () => <Calendar captionLayout="dropdown" />,
};

// Calendar with disabled dates (past dates disabled)
export const WithDisabledDates: Story = {
  render: () => <Calendar disabled={(date: Date) => date < new Date()} />,
};

// Calendar without outside days
export const WithoutOutsideDays: Story = {
  render: () => <Calendar showOutsideDays={false} />,
};

// Calendar with different button variant
export const WithOutlineButtons: Story = {
  render: () => <Calendar buttonVariant="outline" />,
};

// Calendar with dropdown for months and years
export const WithDropdownMonths: Story = {
  render: () => <Calendar captionLayout="dropdown-months" />,
};

// Calendar with dropdown for years only
export const WithDropdownYears: Story = {
  render: () => <Calendar captionLayout="dropdown-years" />,
};
