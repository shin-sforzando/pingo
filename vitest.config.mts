import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  // define: {
  //   "process.env": process.env,
  // },
  test: {
    pool: "forks",
    workspace: [
      {
        extends: true,
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
          exclude: ["src/**/*.browser.{test,spec}.{js,ts,jsx,tsx}"],
          setupFiles: ["./vitest.setup.ts"], // Add setup file
          testTimeout: 10000, // Increase timeout for Firebase operations
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          include: ["src/**/*.browser.{test,spec}.{js,ts,jsx,tsx}"],
          browser: {
            enabled: true,
            headless: false,
            provider: "playwright",
            instances: [{ browser: "webkit" }],
          },
        },
      },
    ],
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
