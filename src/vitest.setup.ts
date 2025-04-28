import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./lib/msw/node"; // Import the MSW node server

// --- MSW Server Lifecycle for general Vitest tests ---
// Start the server before all tests run in this environment
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset any request handlers that may be added during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());
// --- End MSW Server Lifecycle ---

// Add any other global setup for non-Storybook tests here if needed
