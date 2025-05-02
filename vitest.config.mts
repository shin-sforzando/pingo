import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  define: {
    "process.env": JSON.stringify({}),
  },
  test: {
    // environment: "jsdom",
    browser: {
      enabled: true,
      // headless: true,
      provider: "playwright",
      instances: [{ browser: "chromium" }],
    },
    coverage: {
      enabled: true,
      provider: "istanbul",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      exclude: [
        "next.config.ts", // Exclude Next.js config
        "postcss.config.mjs", // Exclude PostCSS config
        "**/*.stories.{ts, tsx}", // Exclude Storybook stories
        "**/stories/example/*.tsx", // Exclude example stories
        ...coverageConfigDefaults.exclude,
      ],
    },
  },
});
