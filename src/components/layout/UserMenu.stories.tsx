import type { Meta, StoryObj } from "@storybook/react";
import { UserMenu } from "./UserMenu";

const meta: Meta<typeof UserMenu> = {
  title: "Layout/UserMenu",
  component: UserMenu,
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
type Story = StoryObj<typeof UserMenu>;

export const Default: Story = {};
