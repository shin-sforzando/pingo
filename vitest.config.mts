import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    pool: "forks",
    setupFiles: ["src/vitest.setup.ts"],
    coverage: {
      enabled: true,
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      exclude: [
        "next.config.ts", // Exclude Next.js config
        "postcss.config.mjs", // Exclude PostCSS config
        "public/mockServiceWorker.js", // Exclude MSW service worker
        "src/lib/msw/browser.ts", // Exclude MSW browser setup
        "src/lib/msw/node.ts", // Exclude MSW node setup
        "**/*.stories.{ts, tsx}", // Exclude Storybook stories
        "**/stories/example/*.tsx", // Exclude example stories
        ...coverageConfigDefaults.exclude,
      ],
    },
  },
});
