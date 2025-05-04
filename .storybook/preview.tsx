import { MINIMAL_VIEWPORTS } from "@storybook/addon-viewport";
import type { Decorator, Preview } from "@storybook/react";
// biome-ignore lint/correctness/noUnusedImports: React is needed for TSX
import React from "react";
import { LocaleProvider } from "../src/i18n/LocaleContext";
import { LOCALES, LOCALE_NAMES, type LocaleType } from "../src/i18n/config";
import "../src/app/globals.css";

/**
 * Decorator to wrap all stories with LocaleProvider
 * This ensures that useLocale hook works in all stories
 */
const withLocaleProvider: Decorator = (Story, context) => {
  // Get locale from toolbar or use default
  const locale = (context.globals.locale as LocaleType) || LOCALES.JA;

  return (
    <LocaleProvider defaultLocale={locale}>
      <div style={{ margin: "1rem" }}>
        <Story />
      </div>
    </LocaleProvider>
  );
};

const preview: Preview = {
  // Apply the decorator to all stories
  decorators: [withLocaleProvider],
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
  globalTypes: {
    locale: {
      name: "Locale",
      description: "Internationalization locale",
      defaultValue: LOCALES.JA,
      toolbar: {
        icon: "globe",
        items: [
          { value: LOCALES.JA, title: LOCALE_NAMES[LOCALES.JA] },
          { value: LOCALES.EN, title: LOCALE_NAMES[LOCALES.EN] },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
