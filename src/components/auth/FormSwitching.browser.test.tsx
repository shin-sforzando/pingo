import { page, userEvent } from "@vitest/browser/context";
import { NextIntlClientProvider } from "next-intl";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

import enMessages from "../../../messages/en.json";

// Mock for testing form switching with error state
const mockAuthWithError = {
  register: vi.fn().mockResolvedValue(false),
  login: vi.fn().mockResolvedValue(false),
  error: "Test error message",
  clearError: vi.fn(),
};

// Mock the AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthWithError,
  AuthContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

describe("Form switching error handling", () => {
  describe("Error message clearing when switching forms", () => {
    it("clears error message when switching from LoginForm to RegisterForm", async () => {
      // Create a component that can switch between forms
      const TestComponent = () => {
        const [showLogin, setShowLogin] = useState(true);

        return (
          <div>
            {showLogin ? (
              <LoginForm onRegisterClick={() => setShowLogin(false)} />
            ) : (
              <RegisterForm onLoginClick={() => setShowLogin(true)} />
            )}
          </div>
        );
      };

      // Render the test component
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <TestComponent />
        </NextIntlClientProvider>,
      );

      // Verify error message is displayed in LoginForm
      const errorMessage = page.getByText("Test error message");
      await expect.element(errorMessage).toBeVisible();

      // Find and click the register link to switch to RegisterForm
      const registerLink = page.getByRole("button", {
        name: enMessages.Auth.register,
      });
      await userEvent.click(registerLink);

      // Verify clearError was called when switching forms
      expect(mockAuthWithError.clearError).toHaveBeenCalled();
    });

    it("clears error message when switching from RegisterForm to LoginForm", async () => {
      // Create a component that can switch between forms
      const TestComponent = () => {
        const [showLogin, setShowLogin] = useState(false);

        return (
          <div>
            {showLogin ? (
              <LoginForm onRegisterClick={() => setShowLogin(false)} />
            ) : (
              <RegisterForm onLoginClick={() => setShowLogin(true)} />
            )}
          </div>
        );
      };

      // Render the test component
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <TestComponent />
        </NextIntlClientProvider>,
      );

      // Verify error message is displayed in RegisterForm
      const errorMessage = page.getByText("Test error message");
      await expect.element(errorMessage).toBeVisible();

      // Find and click the login link to switch to LoginForm
      const loginLink = page.getByRole("button", {
        name: enMessages.Auth.login,
      });
      await userEvent.click(loginLink);

      // Verify clearError was called when switching forms
      expect(mockAuthWithError.clearError).toHaveBeenCalled();
    });
  });
});
