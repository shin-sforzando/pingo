import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NotificationDrawer } from "./NotificationDrawer";

const meta: Meta<typeof NotificationDrawer> = {
  title: "Layout/NotificationDrawer",
  component: NotificationDrawer,
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
};

export default meta;
type Story = StoryObj<typeof NotificationDrawer>;

// We need to use a wrapper component to manage state
const NotificationDrawerWithTrigger = () => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Notification Drawer</Button>
      <NotificationDrawer open={open} onOpenChange={setOpen} />
    </div>
  );
};

export const Default: Story = {
  render: () => <NotificationDrawerWithTrigger />,
};
