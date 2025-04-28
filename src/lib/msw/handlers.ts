/**
 * Defines all the request handlers for Mock Service Worker (MSW).
 * This array will be imported by both browser and node setups.
 * Add individual API endpoint handlers to this array.
 *
 * Why handlers are centralized here:
 * - Single source of truth for all API mocks.
 * - Easy to manage and update mocks across different environments (browser, node, storybook).
 */
import { authHandlers } from "./handlers/auth";
import { gameHandlers } from "./handlers/game";
import { imageHandlers } from "./handlers/image";
import { userApiHandlers } from "./handlers/userApi";
// Import other handler groups here as they are created

export const handlers = [
  ...authHandlers,
  ...userApiHandlers,
  ...gameHandlers,
  ...imageHandlers,
  // Add other handlers here, potentially including generic fallbacks or examples
  // Example:
  // http.get('/api/users/:userId', () => {
  //   return HttpResponse.json({ id: '123', name: 'John Doe' });
  // }),
];
