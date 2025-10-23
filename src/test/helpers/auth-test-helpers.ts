import { ulid } from "ulid";
import { vi } from "vitest";
import type { AuthContextType } from "@/contexts/AuthContext";
import type { User } from "@/types/schema";

/**
 * Authentication test helpers
 *
 * Why: Centralizes auth-related mocking for consistent test behavior
 * Why: Prevents test duplication and maintains DRY principle
 * Why: Provides type-safe mocks for authentication components
 */

/**
 * Creates a mock user for testing
 * Why: Provides consistent test data structure
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: ulid(),
    username: "testuser",
    createdAt: new Date(),
    lastLoginAt: new Date(),
    participatingGames: [],
    gameHistory: [],
    isTestUser: true,
    ...overrides,
  };
}

/**
 * Mocks the AuthGuard component to bypass authentication in tests
 * Why: Allows testing of protected components without authentication setup
 */
export function mockAuthGuard() {
  vi.mock("@/components/auth/AuthGuard", () => ({
    AuthGuard: ({ children }: { children: React.ReactNode }) => children,
  }));
}

/**
 * Creates a mock authenticated user state for useAuth hook
 * Why: Simulates authenticated state for components that depend on auth
 */
export function mockAuthenticatedUser(
  userOverrides: Partial<User> = {},
): AuthContextType {
  const mockUser = createMockUser(userOverrides);

  return {
    user: mockUser,
    loading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    refreshUser: vi.fn(),
  };
}

/**
 * Creates a mock unauthenticated user state for useAuth hook
 * Why: Simulates unauthenticated state for testing auth flows
 */
export function mockUnauthenticatedUser(): AuthContextType {
  return {
    user: null,
    loading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    refreshUser: vi.fn(),
  };
}

/**
 * Creates a mock loading auth state for useAuth hook
 * Why: Simulates loading state for testing loading UI
 */
export function mockLoadingAuthState(): AuthContextType {
  return {
    user: null,
    loading: true,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    refreshUser: vi.fn(),
  };
}
