import { AuthContext } from "@/contexts/AuthContext";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { RegisterForm } from "./RegisterForm";

const meta: Meta<typeof RegisterForm> = {
  title: "Auth/RegisterForm",
  component: RegisterForm,
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
        register: async () => {
          // Simulate a delay
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return true;
        },
        login: async () => false,
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
type Story = StoryObj<typeof RegisterForm>;

export const Default: Story = {
  args: {},
};

export const WithLoginLink: Story = {
  args: {
    onLoginClick: () => alert("Login clicked"),
  },
};

export const WithCancelButton: Story = {
  args: {
    onCancel: () => alert("Cancel clicked"),
  },
};

export const WithAllCallbacks: Story = {
  args: {
    onSuccess: () => alert("Registration successful"),
    onCancel: () => alert("Cancel clicked"),
    onLoginClick: () => alert("Login clicked"),
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
        error: "Username is already taken",
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
