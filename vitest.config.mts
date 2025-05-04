import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  define: {
    "process.env": JSON.stringify({}),
  },
  test: {
    browser: {
      enabled: true,
      headless: false,
      provider: "playwright",
      instances: [{ browser: "webkit" }],
    },
    coverage: {
      enabled: true,
      provider: "istanbul",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      exclude: [
        "next.config.ts", // Exclude Next.js config
        "postcss.config.mjs", // Exclude PostCSS config
        "src/i18n/*.ts", // Exclude i18n config
        "**/*.stories.{ts,tsx}", // Exclude Storybook stories
        "**/stories/example/*.tsx", // Exclude example stories
        ...coverageConfigDefaults.exclude,
      ],
    },
  },
});
