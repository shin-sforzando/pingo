import { AuthContext } from "@/contexts/AuthContext";
import type { Meta, StoryObj } from "@storybook/react";
import type { User } from "firebase/auth";
import Home from "./page";

// Mock user for authenticated state
const mockUser: User = {
  uid: "test-user-id",
  // Only include properties that are actually used in the component
  getIdToken: async () => "mock-token",
} as User;

// Mock user profile for authenticated state
const mockUserProfile = {
  id: "test-user-id",
  username: "John Doe",
  createdAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
};

const meta: Meta<typeof Home> = {
  title: "App/Home",
  component: Home,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Home>;

// Unauthenticated state story
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

// Authenticated state story
export const Authenticated: Story = {
  decorators: [
    (Story) => (
      <AuthContext.Provider
        value={{
          user: mockUser,
          userProfile: mockUserProfile,
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
