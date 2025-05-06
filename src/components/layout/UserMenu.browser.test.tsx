import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { UserMenu } from "./UserMenu";

import jaMessages from "../../../messages/ja.json";

// Mock the AuthContext to avoid Firebase initialization
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

describe("UserMenu", () => {
  it("renders without crashing", () => {
    expect(() => (
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <UserMenu />
      </NextIntlClientProvider>
    )).not.toThrow();
  });
});

// Create a separate test file for authenticated user tests
// src/components/layout/UserMenu.authenticated.browser.test.tsx

// Create a separate test file for unauthenticated user tests
// src/components/layout/UserMenu.unauthenticated.browser.test.tsx
