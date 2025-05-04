import { MINIMAL_VIEWPORTS } from "@storybook/addon-viewport";
import type { Decorator, Preview } from "@storybook/react";
// biome-ignore lint/correctness/noUnusedImports: React is needed for TSX
import React from "react";
import { LocaleProvider } from "../src/i18n/LocaleContext";
import { LOCALES } from "../src/i18n/config";
import "../src/app/globals.css";

/**
 * Decorator to clear locale cookies before rendering stories
 * This ensures consistent and reproducible story rendering
 */
const clearLocaleCookies: Decorator = (Story) => {
  // In Storybook environment, we want to clear cookies to ensure reproducibility
  document.cookie = "NEXT_LOCALE=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  return <Story />;
};

/**
 * Decorator to wrap all stories with LocaleProvider
 * This provides a basic context for components that use useLocale hook
 */
const withLocaleProvider: Decorator = (Story) => {
  return (
    <LocaleProvider defaultLocale={LOCALES.JA}>
      <div style={{ margin: "1rem" }}>
        <Story />
      </div>
    </LocaleProvider>
  );
};

const preview: Preview = {
  // Apply the decorators to all stories
  decorators: [clearLocaleCookies, withLocaleProvider],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      viewports: MINIMAL_VIEWPORTS,
      defaultViewport: "mobile1",
    },
  },
};

export default preview;
