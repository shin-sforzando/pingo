import { page, userEvent } from "@vitest/browser/context";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { RegisterForm } from "./RegisterForm";

import enMessages from "../../../messages/en.json";
import jaMessages from "../../../messages/ja.json";

// Mock the AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    register: vi.fn().mockResolvedValue(true),
    error: null,
    clearError: vi.fn(),
  }),
  AuthContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

describe("RegisterForm", () => {
  it("renders without crashing", () => {
    expect(() => (
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <RegisterForm />
      </NextIntlClientProvider>
    )).not.toThrow();
  });

  describe("with Japanese locale", () => {
    it("displays the register form with all fields", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <RegisterForm />
        </NextIntlClientProvider>,
      );

      // Check form title
      const title = page.getByRole("heading", {
        name: jaMessages.Auth.register,
      });
      await expect.element(title).toBeVisible();

      // Check username field
      const usernameLabel = page.getByLabelText(jaMessages.Auth.username);
      await expect.element(usernameLabel).toBeVisible();

      // Check password fields
      const passwordInput = page.getByPlaceholder(
        jaMessages.Auth.passwordPlaceholder,
      );
      await expect.element(passwordInput).toBeVisible();

      const confirmPasswordInput = page.getByPlaceholder(
        jaMessages.Auth.confirmPasswordPlaceholder,
      );
      await expect.element(confirmPasswordInput).toBeVisible();

      // Check register button
      const registerButton = page.getByRole("button", {
        name: jaMessages.Auth.register,
      });
      await expect.element(registerButton).toBeVisible();
    });

    it("displays the terms of service notice with link", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <RegisterForm />
        </NextIntlClientProvider>,
      );

      // Find the terms of service link
      const termsLink = page.getByRole("link", { name: "利用規約" });
      await expect.element(termsLink).toBeVisible();
      await expect.element(termsLink).toHaveAttribute("href", "/terms");
      await expect.element(termsLink).toHaveAttribute("target", "_blank");
      await expect.element(termsLink).toHaveAttribute("rel", "noreferrer");
    });
  });

  describe("with English locale", () => {
    it("displays the register form with all fields", async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <RegisterForm />
        </NextIntlClientProvider>,
      );

      // Check form title
      const title = page.getByRole("heading", {
        name: enMessages.Auth.register,
      });
      await expect.element(title).toBeVisible();

      // Check username field
      const usernameLabel = page.getByLabelText(enMessages.Auth.username);
      await expect.element(usernameLabel).toBeVisible();

      // Check password fields
      const passwordInput = page.getByPlaceholder(
        enMessages.Auth.passwordPlaceholder,
      );
      await expect.element(passwordInput).toBeVisible();

      const confirmPasswordInput = page.getByPlaceholder(
        enMessages.Auth.confirmPasswordPlaceholder,
      );
      await expect.element(confirmPasswordInput).toBeVisible();

      // Check register button
      const registerButton = page.getByRole("button", {
        name: enMessages.Auth.register,
      });
      await expect.element(registerButton).toBeVisible();
    });

    it("displays the terms of service notice with link", async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <RegisterForm />
        </NextIntlClientProvider>,
      );

      // Find the terms of service link
      const termsLink = page.getByRole("link", { name: "Terms of Service" });
      await expect.element(termsLink).toBeVisible();
      await expect.element(termsLink).toHaveAttribute("href", "/terms");
      await expect.element(termsLink).toHaveAttribute("target", "_blank");
      await expect.element(termsLink).toHaveAttribute("rel", "noreferrer");
    });
  });

  describe("with callbacks", () => {
    it("calls onLoginClick when login link is clicked", async () => {
      const onLoginClick = vi.fn();
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <RegisterForm onLoginClick={onLoginClick} />
        </NextIntlClientProvider>,
      );

      // Find and click the login link
      const loginLink = page.getByRole("button", {
        name: enMessages.Auth.login,
      });
      await userEvent.click(loginLink);

      // Check if onLoginClick was called
      expect(onLoginClick).toHaveBeenCalled();
    });

    it("calls onCancel when cancel button is clicked", async () => {
      const onCancel = vi.fn();
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <RegisterForm onCancel={onCancel} />
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
