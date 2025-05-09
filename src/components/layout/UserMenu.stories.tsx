import { AuthContext } from "@/contexts/AuthContext";
import type { Meta, StoryObj } from "@storybook/react";
import type { User } from "firebase/auth";
import { UserMenu } from "./UserMenu";

const meta: Meta<typeof UserMenu> = {
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
};

export default meta;
type Story = StoryObj<typeof UserMenu>;

// Default story - uses the actual AuthContext
export const Default: Story = {};

// Authenticated user story
export const Authenticated: Story = {
  decorators: [
    (Story) => (
      <AuthContext.Provider
        value={{
          user: { uid: "test-uid" } as User,
          userProfile: {
            id: "test-uid",
            username: "TestUser",
            createdAt: "",
            lastLoginAt: "",
          },
          isLoading: false,
          error: null,
          register: async () => false,
          login: async () => false,
          logout: async () => false,
          updateProfile: async () => false,
          clearError: () => {},
        }}
      >
        <Story />
      </AuthContext.Provider>
    ),
  ],
};

// Unauthenticated user story
export const Unauthenticated: Story = {
  decorators: [
    (Story) => (
      <AuthContext.Provider
        value={{
          user: null,
          userProfile: null,
          isLoading: false,
          error: null,
          register: async () => false,
          login: async () => false,
          logout: async () => false,
          updateProfile: async () => false,
          clearError: () => {},
        }}
      >
        <Story />
      </AuthContext.Provider>
    ),
  ],
};

// Loading state story
export const Loading: Story = {
  decorators: [
    (Story) => (
      <AuthContext.Provider
        value={{
          user: null,
          userProfile: null,
          isLoading: true,
          error: null,
          register: async () => false,
          login: async () => false,
          logout: async () => false,
          updateProfile: async () => false,
          clearError: () => {},
        }}
      >
        <Story />
      </AuthContext.Provider>
    ),
  ],
};
