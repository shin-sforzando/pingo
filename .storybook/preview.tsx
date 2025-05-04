import { MINIMAL_VIEWPORTS } from "@storybook/addon-viewport";
import type { Decorator, Preview } from "@storybook/react";
import React from "react";
import { LocaleProvider } from "../src/i18n/LocaleContext";
import { LOCALES, LOCALE_NAMES, type LocaleType } from "../src/i18n/config";
import "../src/app/globals.css";

/**
 * Decorator to wrap all stories with LocaleProvider
 * This ensures that useLocale hook works in all stories and responds to toolbar changes
 */
const withLocaleProvider: Decorator = (Story, context) => {
  // Get locale from toolbar or use default
  const locale = (context.globals.locale as LocaleType) || LOCALES.JA;

  // Use React's useEffect to update locale when Storybook toolbar selection changes
  React.useEffect(() => {
    // This will directly update the document cookie and HTML lang attribute
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;
    document.documentElement.lang = locale;

    // Force re-render by dispatching a custom event that components can listen for
    window.dispatchEvent(
      new CustomEvent("locale change", { detail: { locale } }),
    );
  }, [locale]);

  return (
    // Use a key to force complete re-render when locale changes
    <LocaleProvider key={locale} defaultLocale={locale}>
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
