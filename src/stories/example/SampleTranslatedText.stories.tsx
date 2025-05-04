import type { Meta, StoryObj } from "@storybook/react";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { LOCALES } from "../../i18n/config";
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
 * Default story that uses the global locale setting (Japanese).
 */
export const Default: Story = {};

/**
 * Japanese version of the component.
 * This story always displays in Japanese.
 */
export const Japanese: Story = {
  decorators: [
    (Story) => {
      // Force Japanese locale
      return (
        // Key is important to force re-render
        <LocaleProvider key="ja-forced" defaultLocale={LOCALES.JA}>
          <div style={{ margin: "1rem" }}>
            <Story />
          </div>
        </LocaleProvider>
      );
    },
  ],
  // Override the global decorator
  parameters: {
    decorators: [], // Empty array to disable global decorators
  },
};

/**
 * English version of the component.
 * This story always displays in English.
 */
export const English: Story = {
  decorators: [
    (Story) => {
      // Force English locale
      return (
        // Key is important to force re-render
        <LocaleProvider key="en-forced" defaultLocale={LOCALES.EN}>
          <div style={{ margin: "1rem" }}>
            <Story />
          </div>
        </LocaleProvider>
      );
    },
  ],
  // Override the global decorator
  parameters: {
    decorators: [], // Empty array to disable global decorators
  },
};
