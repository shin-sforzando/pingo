import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true, // Optional: Enables global APIs like describe, it, expect
    environment: "jsdom",
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
        "**/*.stories.{ts, tsx}", // Exclude Storybook stories
        "**/stories/example/*.tsx", // Exclude example stories
        ...coverageConfigDefaults.exclude,
      ],
    },
  },
});
