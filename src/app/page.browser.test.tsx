import { page } from "@vitest/browser/context";
import { NextIntlClientProvider } from "next-intl";
import { ulid } from "ulid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { AuthProvider } from "@/contexts/AuthContext";
import type { User } from "@/types/schema";
import enMessages from "../../messages/en.json";
import jaMessages from "../../messages/ja.json";
import HomePage from "./page";

// Define mocked functions using vi.hoisted
const useAuthMock = vi.hoisted(() => vi.fn());

// Mock the AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: useAuthMock,
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock the components
vi.mock("@/components/auth/LoginForm", () => ({
  LoginForm: ({
    onSuccess,
  }: {
    onSuccess: () => void;
    onError: (error: Error) => void;
  }) => (
    <div data-testid="login-form">
      <input
        type="text"
        name="username"
        placeholder="Username"
        data-testid="username-input"
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        data-testid="password-input"
      />
      <button
        type="button"
        onClick={() => onSuccess()}
        data-testid="submit-button"
      >
        Login
      </button>
    </div>
  ),
}));

vi.mock("@/components/auth/RegisterForm", () => ({
  RegisterForm: ({
    onSuccess,
  }: {
    onSuccess: () => void;
    onError: (error: Error) => void;
  }) => (
    <div data-testid="register-form">
      <input
        type="text"
        name="username"
        placeholder="Username"
        data-testid="username-input"
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        data-testid="password-input"
      />
      <input
        type="password"
        name="confirmPassword"
        placeholder="Confirm Password"
        data-testid="confirm-password-input"
      />
      <button
        type="button"
        onClick={() => onSuccess()}
        data-testid="submit-button"
      >
        Register
      </button>
    </div>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    asChild,
    className,
    onClick,
    type,
    variant,
    size,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
    className?: string;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
    variant?: string;
    size?: string;
  }) => {
    if (asChild) {
      return <div className={className}>{children}</div>;
    }
    return (
      <button
        className={className}
        onClick={onClick}
        type={type}
        data-variant={variant}
        data-size={size}
      >
        {children}
      </button>
    );
  },
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-title">{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({
    children,
    value,
    className,
  }: {
    children: React.ReactNode;
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    className?: string;
  }) => (
    <div data-testid="tabs" data-value={value} className={className}>
      {children}
    </div>
  ),
  TabsList: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="tabs-list" className={className}>
      {children}
    </div>
  ),
  TabsTrigger: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => (
    <button type="button" data-testid="tab" data-value={value} role="tab">
      {children}
    </button>
  ),
  TabsContent: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => (
    <div data-testid="tabs-content" data-value={value} role="tabpanel">
      {children}
    </div>
  ),
}));

// Mock next/link
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

// Mock next/image
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
    fill?: boolean;
    sizes?: string;
  }) => (
    // biome-ignore lint/performance/noImgElement: Mock for testing purposes
    <img src={src} alt={alt} className={className} />
  ),
}));

describe("HomePage", () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  describe("with English locale - User not logged in", () => {
    beforeEach(() => {
      // Mock user as not logged in
      useAuthMock.mockReturnValue({
        user: null,
        loading: false,
        error: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
      });
    });

    it("renders the login/register form and how to play section", async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <AuthProvider>
            <HomePage />
          </AuthProvider>
        </NextIntlClientProvider>,
      );

      // Check for login/register tabs
      await expect
        .element(page.getByRole("tab", { name: enMessages.Auth.login }))
        .toBeVisible();
      await expect
        .element(page.getByRole("tab", { name: enMessages.Auth.register }))
        .toBeVisible();

      // Check for login form fields
      await expect.element(page.getByTestId("login-form")).toBeVisible();

      // Check for how to play section
      await expect
        .element(
          page.getByRole("heading", { name: enMessages.HomePage.howToPlay }),
        )
        .toBeVisible();
      await expect
        .element(page.getByText(enMessages.HomePage.howToPlayDescription))
        .toBeVisible();
    });

    it("switches between login and register tabs", async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <AuthProvider>
            <HomePage />
          </AuthProvider>
        </NextIntlClientProvider>,
      );

      // Check that login tab is active by default
      await expect.element(page.getByTestId("login-form")).toBeVisible();

      // Click on register tab
      await page.getByRole("tab", { name: enMessages.Auth.register }).click();

      // Check that register tab is now active
      await expect.element(page.getByTestId("register-form")).toBeVisible();

      // Click on login tab again
      await page.getByRole("tab", { name: enMessages.Auth.login }).click();

      // Check that login tab is active again
      await expect.element(page.getByTestId("login-form")).toBeVisible();
    });
  });

  describe("with English locale - User logged in", () => {
    beforeEach(() => {
      // Mock user as logged in
      // Create a mock user with all required properties
      const mockUser: User = {
        id: ulid(), // Generate a valid ULID
        username: "testuser",
        createdAt: new Date(),
        lastLoginAt: new Date(),
        participatingGames: [],
        gameHistory: [],
        isTestUser: true,
      };

      useAuthMock.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
      });
    });

    it("renders the game action buttons and how to play section", async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <AuthProvider>
            <HomePage />
          </AuthProvider>
        </NextIntlClientProvider>,
      );

      // Check for game action buttons
      await expect
        .element(
          page.getByRole("link", { name: enMessages.HomePage.createGame }),
        )
        .toBeVisible();
      await expect
        .element(page.getByRole("link", { name: enMessages.HomePage.joinGame }))
        .toBeVisible();

      // Check for how to play section
      await expect
        .element(
          page.getByRole("heading", { name: enMessages.HomePage.howToPlay }),
        )
        .toBeVisible();
      await expect
        .element(page.getByText(enMessages.HomePage.howToPlayDescription))
        .toBeVisible();
    });

    it("has correct href attributes on game action buttons", async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <AuthProvider>
            <HomePage />
          </AuthProvider>
        </NextIntlClientProvider>,
      );

      // Check href attributes
      await expect
        .element(
          page.getByRole("link", { name: enMessages.HomePage.createGame }),
        )
        .toHaveAttribute("href", "/game/create");
      await expect
        .element(page.getByRole("link", { name: enMessages.HomePage.joinGame }))
        .toHaveAttribute("href", "/game/join");
    });
  });

  describe("with Japanese locale - User not logged in", () => {
    beforeEach(() => {
      // Mock user as not logged in
      useAuthMock.mockReturnValue({
        user: null,
        loading: false,
        error: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
      });
    });

    it("renders the login/register form and how to play section in Japanese", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <AuthProvider>
            <HomePage />
          </AuthProvider>
        </NextIntlClientProvider>,
      );

      // Check for login/register tabs
      await expect
        .element(page.getByRole("tab", { name: jaMessages.Auth.login }))
        .toBeVisible();
      await expect
        .element(page.getByRole("tab", { name: jaMessages.Auth.register }))
        .toBeVisible();

      // Check for how to play section
      await expect
        .element(
          page.getByRole("heading", { name: jaMessages.HomePage.howToPlay }),
        )
        .toBeVisible();
      await expect
        .element(page.getByText(jaMessages.HomePage.howToPlayDescription))
        .toBeVisible();
    });
  });

  describe("with Japanese locale - User logged in", () => {
    beforeEach(() => {
      // Mock user as logged in
      // Create a mock user with all required properties
      const mockUser: User = {
        id: ulid(), // Generate a valid ULID
        username: "testuser",
        createdAt: new Date(),
        lastLoginAt: new Date(),
        participatingGames: [],
        gameHistory: [],
        isTestUser: true,
      };

      useAuthMock.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
      });
    });

    it("renders the game action buttons and how to play section in Japanese", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <AuthProvider>
            <HomePage />
          </AuthProvider>
        </NextIntlClientProvider>,
      );

      // Check for game action buttons
      await expect
        .element(
          page.getByRole("link", { name: jaMessages.HomePage.createGame }),
        )
        .toBeVisible();
      await expect
        .element(page.getByRole("link", { name: jaMessages.HomePage.joinGame }))
        .toBeVisible();

      // Check for how to play section
      await expect
        .element(
          page.getByRole("heading", { name: jaMessages.HomePage.howToPlay }),
        )
        .toBeVisible();
      await expect
        .element(page.getByText(jaMessages.HomePage.howToPlayDescription))
        .toBeVisible();
    });
  });
});
