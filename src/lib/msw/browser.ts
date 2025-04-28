import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/**
 * Configures and exports the MSW worker instance for browser environments.
 * This worker intercepts requests made from the browser (e.g., during development, testing, Storybook).
 *
 * Why setupWorker is used here:
 * - It leverages Service Workers to intercept requests at the network level in the browser.
 * - Provides a seamless mocking experience without modifying application code.
 */
export const worker = setupWorker(...handlers);

/**
 * Starts the MSW worker in the browser.
 * Should be called conditionally, typically only in development or specific testing environments.
 *
 * Example Usage (e.g., in _app.tsx or a client-side entry point):
 * if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
 *   import('../lib/msw/browser').then(({ startWorker }) => {
 *     startWorker();
 *   });
 * }
 *
 * Why conditional start:
 * - Avoids running MSW in production builds.
 * - Ensures it only runs in client-side environments.
 */
export async function startWorker() {
  // Start the worker.
  // Using quiet: true suppresses the "MSW enabled" message in the console.
  await worker.start({
    onUnhandledRequest: "bypass", // Allows requests not handled by MSW to pass through
    quiet: true,
  });
  console.log("MSW worker started for browser.");
}
