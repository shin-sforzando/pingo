import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/react";
import CreateGamePage from "./page";

// Mock the fetch API for Storybook
if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    console.log(`Mocked fetch: ${input}`);

    // Mock response for /api/subjects/generate
    if (input === "/api/subjects/generate") {
      return {
        ok: true,
        json: async () => ({
          candidates: faker.helpers.multiple(() => faker.word.noun(), {
            count: 30,
          }),
        }),
      } as Response;
    }

    // Mock response for /api/subjects/check
    if (input === "/api/subjects/check") {
      return {
        ok: true,
        json: async () => ({
          ok: true,
        }),
      } as Response;
    }

    // Default to original fetch for other requests
    return originalFetch(input, init);
  };
}

// Mock Firebase auth for Storybook
if (typeof window !== "undefined") {
  // @ts-ignore - Mock auth object for Storybook
  window.mockFirebaseAuth = {
    currentUser: {
      getIdToken: () => Promise.resolve("mock-id-token"),
    },
  };
}

const meta = {
  title: "Pages/Game/Create",
  component: CreateGamePage,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof CreateGamePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
