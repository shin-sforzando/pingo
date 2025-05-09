import { page, userEvent } from "@vitest/browser/context";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { LoginForm } from "./LoginForm";

import enMessages from "../../../messages/en.json";
import jaMessages from "../../../messages/ja.json";

// Mock the AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    login: vi.fn().mockResolvedValue(true),
    error: null,
    clearError: vi.fn(),
  }),
  AuthContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

describe("LoginForm", () => {
  it("renders without crashing", () => {
    expect(() => (
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <LoginForm />
      </NextIntlClientProvider>
    )).not.toThrow();
  });

  describe("with Japanese locale", () => {
    it("displays the login form with all fields", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <LoginForm />
        </NextIntlClientProvider>,
      );

      // Check form title
      const title = page.getByRole("heading", {
        name: jaMessages.Auth.login,
      });
      await expect.element(title).toBeVisible();

      // Check username field
      const usernameLabel = page.getByLabelText(jaMessages.Auth.username);
      await expect.element(usernameLabel).toBeVisible();

      // Check password field
      const passwordInput = page.getByPlaceholder(
        jaMessages.Auth.passwordPlaceholder,
      );
      await expect.element(passwordInput).toBeVisible();

      // Check login button
      const loginButton = page.getByRole("button", {
        name: jaMessages.Auth.login,
      });
      await expect.element(loginButton).toBeVisible();
    });
  });

  describe("with English locale", () => {
    it("displays the login form with all fields", async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <LoginForm />
        </NextIntlClientProvider>,
      );

      // Check form title
      const title = page.getByRole("heading", {
        name: enMessages.Auth.login,
      });
      await expect.element(title).toBeVisible();

      // Check username field
      const usernameLabel = page.getByLabelText(enMessages.Auth.username);
      await expect.element(usernameLabel).toBeVisible();

      // Check password field
      const passwordInput = page.getByPlaceholder(
        enMessages.Auth.passwordPlaceholder,
      );
      await expect.element(passwordInput).toBeVisible();

      // Check login button
      const loginButton = page.getByRole("button", {
        name: enMessages.Auth.login,
      });
      await expect.element(loginButton).toBeVisible();
    });

    it("validates username and shows error for invalid characters", async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <LoginForm />
        </NextIntlClientProvider>,
      );

      // Enter a username with invalid characters
      const usernameInput = page.getByLabelText(enMessages.Auth.username);
      await userEvent.type(usernameInput, "user$name");

      // Enter valid password
      const passwordInput = page.getByPlaceholder(
        enMessages.Auth.passwordPlaceholder,
      );
      await userEvent.type(passwordInput, "password123");

      // Submit the form
      const loginButton = page.getByRole("button", {
        name: enMessages.Auth.login,
      });
      await userEvent.click(loginButton);

      // Check if validation error message is displayed
      const errorMessage = page.getByText(
        enMessages.Auth.errors.usernameInvalid,
      );
      await expect.element(errorMessage).toBeVisible();
    });
  });

  describe("with callbacks", () => {
    it("calls onRegisterClick when register link is clicked", async () => {
      const onRegisterClick = vi.fn();
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <LoginForm onRegisterClick={onRegisterClick} />
        </NextIntlClientProvider>,
      );

      // Find and click the register link
      const registerLink = page.getByRole("button", {
        name: enMessages.Auth.register,
      });
      await userEvent.click(registerLink);

      // Check if onRegisterClick was called
      expect(onRegisterClick).toHaveBeenCalled();
    });

    it("calls onCancel when cancel button is clicked", async () => {
      const onCancel = vi.fn();
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <LoginForm onCancel={onCancel} />
        </NextIntlClientProvider>,
      );

      // Find and click the cancel button
      const cancelButton = page.getByRole("button", {
        name: enMessages.Auth.cancel,
      });
      await userEvent.click(cancelButton);

      // Check if onCancel was called
      expect(onCancel).toHaveBeenCalled();
    });
  });
});
