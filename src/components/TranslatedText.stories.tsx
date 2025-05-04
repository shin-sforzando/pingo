import type { Meta, StoryObj } from "@storybook/react";
import { TranslatedText } from "./TranslatedText";

const meta = {
  title: "Components/TranslatedText",
  component: TranslatedText,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "example"],
} satisfies Meta<typeof TranslatedText>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Example component showing various translated texts.
 * Use the locale control in the toolbar to switch between languages.
 */
export const Default: Story = {};
