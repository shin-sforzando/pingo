import type { Meta, StoryObj } from "@storybook/react";
import { CookieConsentBanner } from "./CookieConsentBanner";

const meta = {
  title: "Analytics/CookieConsentBanner",
  component: CookieConsentBanner,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof CookieConsentBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default cookie consent banner displayed at the bottom of the screen.
 *
 * Note: In the actual app, this banner only appears when:
 * - User has not yet made a consent choice
 * - No 'pingo_analytics_consent' value exists in localStorage
 */
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The cookie consent banner appears at the bottom of the screen on first visit. " +
          "Users can choose to accept or decline analytics tracking. " +
          "The choice is stored in localStorage and the banner won't appear again.",
      },
    },
  },
};
