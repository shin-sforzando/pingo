import { MINIMAL_VIEWPORTS } from "@storybook/addon-viewport";
import type { Preview } from "@storybook/react";
import "@/app/globals.css";

// Import next-intl configuration
import nextIntl from "./next-intl";

const preview: Preview = {
  parameters: {
    a11y: {
      test: "error",
    },
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
    nextjs: {
      appDirectory: true,
    },
    // Add next-intl configuration
    nextIntl,
  },
  initialGlobals: {
    locale: "ja",
    locales: {
      en: { icon: "🇺🇸", title: "English", right: "EN" },
      ja: { icon: "🇯🇵", title: "日本語", right: "JA" },
    },
  },
};

export default preview;
