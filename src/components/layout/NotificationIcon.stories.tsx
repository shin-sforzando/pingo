import type { Meta, StoryObj } from "@storybook/react";
import { NotificationIcon } from "./NotificationIcon";

const meta = {
  title: "Layout/NotificationIcon",
  component: NotificationIcon,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="flex items-center justify-center p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NotificationIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    hasUnreadNotifications: false,
  },
};

export const WithUnreadNotifications: Story = {
  args: {
    hasUnreadNotifications: true,
  },
};
