import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * Configures and exports the MSW server instance for Node.js environments.
 * This server intercepts requests made from Node.js (e.g., during Vitest unit/integration tests).
 *
 * Why setupServer is used here:
 * - It intercepts requests at the network level within Node.js environments.
 * - Allows testing components or functions that make API calls without needing a live backend.
 */
export const server = setupServer(...handlers);

/**
 * Starts the MSW server for Node.js environments.
 * Typically called in test setup files (e.g., vitest.setup.ts).
 *
 * Example Usage (e.g., in vitest.setup.ts):
 * import { server } from './src/lib/msw/node';
 * beforeAll(() => server.listen({ onUnhandledRequest: 'error' })); // Error on unhandled requests in tests
 * afterEach(() => server.resetHandlers());
 * afterAll(() => server.close());
 *
 * Why manage lifecycle in tests:
 * - Ensures mocks are active before tests run.
 * - Resets handlers between tests to prevent state leakage.
 * - Cleans up the server after all tests complete.
 */
export function startServer() {
  // Listen for requests.
  // It's common to error on unhandled requests during tests to catch unexpected API calls.
  server.listen({ onUnhandledRequest: "error" });
  console.log("MSW server started for Node.js.");
}

// Functions to manage the server lifecycle, often used in test setups.
export function resetServerHandlers() {
  server.resetHandlers();
}

export function stopServer() {
  server.close();
  console.log("MSW server stopped for Node.js.");
}
