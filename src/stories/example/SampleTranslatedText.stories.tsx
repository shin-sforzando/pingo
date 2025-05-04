import type { Meta, StoryObj } from "@storybook/react";
import { SampleTranslatedText } from "./SampleTranslatedText";

const meta = {
  title: "Example/SampleTranslatedText",
  component: SampleTranslatedText,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "example"],
} satisfies Meta<typeof SampleTranslatedText>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Example component showing various translated texts.
 * Use the locale control in the toolbar to switch between languages.
 */
export const Default: Story = {};
