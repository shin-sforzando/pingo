import { MINIMAL_VIEWPORTS } from "@storybook/addon-viewport";
import type { Preview } from "@storybook/react";
import { initialize } from "msw-storybook-addon"; // Import MSW addon
import { handlers } from "../src/lib/msw/handlers"; // Import your MSW handlers
import "../src/app/globals.css";

// Initialize MSW addon. MUST be done BEFORE invoking preview.
// This connects MSW to Storybook's lifecycle.
initialize({
  onUnhandledRequest: "bypass", // Allow requests not handled by mocks to pass through
});

const preview: Preview = {
  parameters: {
    // Pass the handlers to the msw parameter
    msw: {
      handlers: handlers,
    },
    viewport: {
      viewports: MINIMAL_VIEWPORTS,
      defaultViewport: "mobile1",
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
