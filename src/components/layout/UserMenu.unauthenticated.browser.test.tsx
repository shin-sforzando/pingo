import { page, userEvent } from "@vitest/browser/context";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { UserMenu } from "./UserMenu";

import jaMessages from "../../../messages/ja.json";

// Mock the AuthContext for unauthenticated user
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    userProfile: null,
    logout: vi.fn(),
  }),
  AuthContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

// Mock the auth form components
vi.mock("@/components/auth/LoginForm", () => ({
  LoginForm: ({ onRegisterClick }: { onRegisterClick?: () => void }) => (
    <div data-testid="login-form">
      Login Form
      {onRegisterClick && (
        <button
          type="button"
          onClick={onRegisterClick}
          data-testid="register-link"
        >
          Register
        </button>
      )}
    </div>
  ),
}));

vi.mock("@/components/auth/RegisterForm", () => ({
  RegisterForm: ({ onLoginClick }: { onLoginClick?: () => void }) => (
    <div data-testid="register-form">
      Register Form
      {onLoginClick && (
        <button type="button" onClick={onLoginClick} data-testid="login-link">
          Login
        </button>
      )}
    </div>
  ),
}));

describe("UserMenu with unauthenticated user", () => {
  it("shows login form when avatar is clicked", async () => {
    render(
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <UserMenu />
      </NextIntlClientProvider>,
    );

    // Find and click the avatar button
    const avatar = page.getByTestId("my-avatar");
    await userEvent.click(avatar);

    // Check if login form is displayed
    const loginForm = page.getByTestId("login-form");
    await expect.element(loginForm).toBeVisible();
  });

  it("switches to register form when register link is clicked", async () => {
    render(
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <UserMenu />
      </NextIntlClientProvider>,
    );

    // Find and click the avatar button
    const avatar = page.getByTestId("my-avatar");
    await userEvent.click(avatar);

    // Find and click the register link
    const registerLink = page.getByTestId("register-link");
    await userEvent.click(registerLink);

    // Check if register form is displayed
    const registerForm = page.getByTestId("register-form");
    await expect.element(registerForm).toBeVisible();
  });
});
