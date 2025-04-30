import type { userSchema as userSchemaType } from "@/lib/validators/models/user"; // Import schema as type
import type { Meta, StoryObj } from "@storybook/react";
import { http, HttpResponse } from "msw";
import type { z } from "zod";
import { CurrentUserInfo } from "./UserInfo";

const meta: Meta<typeof CurrentUserInfo> = {
  title: "Example/UserInfo",
  component: CurrentUserInfo,
  tags: ["example"],
  parameters: {
    // layout: 'centered', // Optional: center the component
  },
};

export default meta;
type Story = StoryObj<typeof CurrentUserInfo>;

// --- Mock Data ---
// Define mock user data consistent with userSchema
const mockLoggedInUser: z.infer<typeof userSchemaType> = {
  id: "storybook_user_123",
  handle: "StorybookUser",
  createdAt: new Date("2024-03-15T10:00:00Z"),
  lastLoginAt: new Date(), // Use current time for last login
  participatingGames: ["STORYA", "STORYB"], // Use valid Game IDs
  gameHistory: ["OLDONE"], // Use valid Game ID
  settings: {},
};

// --- Stories ---

/**
 * Default story: Displays the information when the user is logged in.
 * MSW intercepts the `/api/auth/session` call and returns mockLoggedInUser.
 */
export const LoggedIn: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/auth/session", () => {
          // Return the mock user data as JSON
          // Note: Dates will be stringified in the actual response
          return HttpResponse.json(mockLoggedInUser);
        }),
      ],
    },
  },
};

/**
 * Logged Out story: Displays the "No user logged in" message.
 * MSW intercepts the `/api/auth/session` call and returns a 401 status or null.
 */
export const LoggedOut: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/auth/session", () => {
          // Simulate the logged-out state (e.g., return null with 200 OK)
          return HttpResponse.json(null, { status: 200 });
          // Or simulate a 401 Unauthorized if the API behaves that way
          // return new HttpResponse(null, { status: 401 });
        }),
      ],
    },
  },
};

/**
 * Loading state story: Shows the loading indicator.
 * MSW intercepts the request but introduces a long delay.
 */
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/auth/session", async () => {
          // Introduce a long delay to show loading state
          await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 seconds delay
          // This response won't actually be used as the story focuses on the loading state
          return HttpResponse.json(mockLoggedInUser);
        }),
      ],
    },
  },
};

/**
 * Error state story: Shows an error message.
 * MSW intercepts the request and returns a server error status.
 */
export const ErrorState: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/auth/session", () => {
          // Simulate a server error
          return new HttpResponse(null, {
            status: 500,
            statusText: "Internal Server Error",
          });
        }),
      ],
    },
  },
};
