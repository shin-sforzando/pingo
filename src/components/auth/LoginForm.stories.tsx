import { AuthContext } from "@/contexts/AuthContext";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { LoginForm } from "./LoginForm";

const meta: Meta<typeof LoginForm> = {
  title: "Auth/LoginForm",
  component: LoginForm,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => {
      // Mock the auth context
      const [error, setError] = useState<string | null>(null);

      const mockAuthContext = {
        user: null,
        userProfile: null,
        isLoading: false,
        error,
        register: async () => false,
        login: async () => {
          // Simulate a delay
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return true;
        },
        logout: async () => false,
        updateProfile: async () => false,
        clearError: () => setError(null),
      };

      return (
        <AuthContext.Provider value={mockAuthContext}>
          <div className="mx-auto max-w-sm rounded-xl bg-white p-6 shadow-md">
            <Story />
          </div>
        </AuthContext.Provider>
      );
    },
  ],
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof LoginForm>;

export const Default: Story = {
  args: {},
};

export const WithRegisterLink: Story = {
  args: {
    onRegisterClick: () => alert("Register clicked"),
  },
};

export const WithCancelButton: Story = {
  args: {
    onCancel: () => alert("Cancel clicked"),
  },
};

export const WithAllCallbacks: Story = {
  args: {
    onSuccess: () => alert("Login successful"),
    onCancel: () => alert("Cancel clicked"),
    onRegisterClick: () => alert("Register clicked"),
  },
};

export const WithError: Story = {
  decorators: [
    (Story) => {
      // Mock the auth context with an error
      const mockAuthContext = {
        user: null,
        userProfile: null,
        isLoading: false,
        error: "Invalid username or password",
        register: async () => false,
        login: async () => false,
        logout: async () => false,
        updateProfile: async () => false,
        clearError: () => {},
      };

      return (
        <AuthContext.Provider value={mockAuthContext}>
          <div className="mx-auto max-w-sm rounded-xl bg-white p-6 shadow-md">
            <Story />
          </div>
        </AuthContext.Provider>
      );
    },
  ],
  args: {},
};
