import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { AuthContext } from "@/contexts/AuthContext";
import { Header } from "./Header";

const meta: Meta<typeof Header> = {
  title: "Layout/Header",
  component: Header,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof Header>;

export const LoggedOut: Story = {
  decorators: [
    (Story) => (
      <AuthContext.Provider
        value={{
          user: null,
          loading: false,
          error: null,
          login: async () => {},
          register: async () => {},
          logout: async () => {},
          updateUser: async () => {},
        }}
      >
        <Story />
      </AuthContext.Provider>
    ),
  ],
};

export const LoggedIn: Story = {
  decorators: [
    (Story) => (
      <AuthContext.Provider
        value={{
          user: {
            id: faker.string.ulid(),
            username: "TestUser",
            createdAt: new Date(),
            lastLoginAt: new Date(),
            participatingGames: faker.helpers.multiple(
              () => {
                return faker.string.alpha({ casing: "upper", length: 6 });
              },
              { count: { min: 1, max: 5 } },
            ),
            gameHistory: [],
            isTestUser: true,
          },
          loading: false,
          error: null,
          login: async () => {},
          register: async () => {},
          logout: async () => {},
          updateUser: async () => {},
        }}
      >
        <Story />
      </AuthContext.Provider>
    ),
  ],
};
