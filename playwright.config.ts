import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  timeout: 30 * 1000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: "http://localhost:3003",
    trace: "on-first-retry",
    screenshot: "on",
  },

  projects: [
    // Prioritize Mobile Safari (iPhone) for testing
    {
      name: "Mobile Safari",
      use: {
        ...devices["iPhone 14"],
      },
    },
    // Additional browsers as needed
    {
      name: "Desktop Chrome",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],

  // Auto-start development server with a different port
  webServer: {
    command: "npm run dev -- -p 3003",
    url: "http://localhost:3003",
    reuseExistingServer: !process.env.CI,
  },
});
