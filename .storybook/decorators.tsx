import type React from "react";

import { AuthContext } from "../src/contexts/AuthContext";

/**
 * Mock auth context decorator for Storybook
 * This decorator provides a mock AuthContext.Provider for components that use useAuth
 */
export const withMockAuthContext = (Story: React.ComponentType) => {
  // Mock auth functions
  const mockAuthValue = {
    user: null,
    loading: false,
    error: null,
    login: async (username: string, password: string) => {
      console.log(`Mock login called with: ${username} / ${password}`);
      return Promise.resolve();
    },
    register: async (
      username: string,
      password: string,
      isTestUser = false,
    ) => {
      console.log(
        `Mock register called with: ${username} / ${password} (isTestUser: ${isTestUser})`,
      );
      return Promise.resolve();
    },
    logout: async () => {
      console.log("Mock logout called");
      return Promise.resolve();
    },
    updateUser: async () => {
      console.log("Mock updateUser called");
      return Promise.resolve();
    },
  };

  return (
    <AuthContext.Provider value={mockAuthValue}>
      <Story />
    </AuthContext.Provider>
  );
};
