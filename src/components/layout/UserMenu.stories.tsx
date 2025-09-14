import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/react";
import { AuthContext } from "@/contexts/AuthContext";
import { UserMenu } from "./UserMenu";

const meta = {
  title: "Layout/UserMenu",
  component: UserMenu,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="flex items-center justify-center p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof UserMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
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

export const WithoutGames: Story = {
  decorators: [
    (Story) => (
      <AuthContext.Provider
        value={{
          user: {
            id: faker.string.ulid(),
            username: "NoGamesUser",
            createdAt: new Date(),
            lastLoginAt: new Date(),
            participatingGames: [],
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
