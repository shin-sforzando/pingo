import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  envDir: ".", // Load .env files from root directory
  test: {
    pool: "forks",
    projects: [
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
          setupFiles: ["./vitest.browser.setup.ts"], // Add browser setup file
        },
      },
    ],
    coverage: {
      enabled: true,
      provider: "istanbul",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      exclude: [
        "**/*.stories.{ts,tsx}", // Exclude Storybook stories
        "**/stories/example/*.tsx", // Exclude example stories
        "next.config.ts", // Exclude Next.js config
        "playwright.config.ts", // Exclude Playwright config
        "postcss.config.mjs", // Exclude PostCSS config
        "scripts/**/*.ts", // Exclude scripts
        "src/app/debug/**/*", // Exclude debug pages
        "src/components/magicui/*.tsx", // Exclude Magic UI components
        "src/components/ui/*.tsx", // Exclude shadcn/ui components
        "src/i18n/*.ts", // Exclude i18n config
        "storybook-static/**", // Exclude Storybook static files
        ...coverageConfigDefaults.exclude,
      ],
    },
  },
});
