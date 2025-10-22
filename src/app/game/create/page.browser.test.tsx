import { page, userEvent } from "@vitest/browser/context";
import { NextIntlClientProvider } from "next-intl";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { mockAuthGuard } from "@/test/helpers/auth-test-helpers";
import enMessages from "../../../../messages/en.json";
import jaMessages from "../../../../messages/ja.json";

import CreateGamePage from "./page";

// Mock the fetch API
const originalFetch = globalThis.fetch;
const mockFetch = vi.fn();
window.fetch = mockFetch;

// Mock AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "test-user-id",
      username: "testuser",
      participatingGames: [],
      gameHistory: [],
      createdAt: new Date(),
      lastLoginAt: new Date(),
      updatedAt: null,
      isTestUser: true,
    },
    loading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    refreshUser: vi.fn(),
  }),
}));

// Mock Firebase auth
vi.mock("@/lib/firebase/client", () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue("mock-id-token"),
    },
  },
}));

// Mock AuthGuard to bypass authentication in tests
mockAuthGuard();

afterAll(() => {
  // Restore the original fetch implementation
  globalThis.fetch = originalFetch;
});

describe("CreateGamePage", () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Default mock implementation for fetch
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          "Red car",
          "Blue sky",
          "Green tree",
          "Yellow flower",
          "White cloud",
          "Black cat",
          "Brown dog",
          "Purple grape",
          "Orange fruit",
          "Pink flamingo",
          "Gray elephant",
          "Silver spoon",
          "Golden ring",
          "Bronze medal",
          "Copper penny",
          "Teal ocean",
          "Magenta flower",
          "Cyan water",
          "Lime fruit",
          "Indigo butterfly",
          "Violet flower",
          "Beige sand",
          "Maroon leaf",
          "Navy blue shirt",
          "Olive tree",
          "Peach fruit",
          "Turquoise jewelry",
          "Lavender plant",
          "Crimson rose",
          "Amber stone",
        ],
      }),
    });
  });

  describe("with English locale", () => {
    it("renders the page title and form", async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <CreateGamePage />
        </NextIntlClientProvider>,
      );

      // Check for page title
      await expect
        .element(page.getByRole("heading", { level: 1 }))
        .toHaveTextContent(enMessages.Game.createNew);

      // Check for form fields
      await expect
        .element(
          page.getByRole("textbox", {
            name: new RegExp(enMessages.Game.title),
          }),
        )
        .toBeVisible();

      await expect
        .element(
          page.getByRole("textbox", {
            name: new RegExp(enMessages.Game.theme),
          }),
        )
        .toBeVisible();

      // Check for generate button
      await expect
        .element(
          page.getByRole("button", {
            name: enMessages.Game.generateSubjectsWithAI,
          }),
        )
        .toBeVisible();

      // Check for submit button
      await expect
        .element(page.getByRole("button", { name: enMessages.Game.create }))
        .toBeVisible();
    });

    it("validates title and theme on blur", async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <CreateGamePage />
        </NextIntlClientProvider>,
      );

      // Get title input and type a long title
      const titleInput = page.getByRole("textbox", {
        name: new RegExp(enMessages.Game.title),
      });
      await titleInput.click();
      await titleInput.fill(
        "This is a very long title that exceeds the maximum length of fifty characters",
      );
      await userEvent.tab();

      // Wait for validation errors to appear
      await expect
        .element(page.getByText(enMessages.Game.errors.titleTooLong))
        .toBeVisible();

      // Get theme input and type a long theme
      const themeInput = page.getByRole("textbox", {
        name: new RegExp(enMessages.Game.theme),
      });
      await themeInput.click();
      await themeInput.fill(
        "This is a very long theme that exceeds the maximum length of fifty characters",
      );
      await userEvent.tab();

      // Wait for validation errors to appear
      await expect
        .element(page.getByText(enMessages.Game.errors.themeTooLong))
        .toBeVisible();
    });

    it("shows validation errors when form is invalid", async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <CreateGamePage />
        </NextIntlClientProvider>,
      );

      // Fill in title and theme with invalid values (too long)
      const titleInput = page.getByRole("textbox", {
        name: new RegExp(enMessages.Game.title),
      });
      await titleInput.click();
      await titleInput.fill(
        "This is a very long title that exceeds the maximum length of fifty characters",
      );
      await userEvent.tab(); // Trigger onBlur validation

      const themeInput = page.getByRole("textbox", {
        name: new RegExp(enMessages.Game.theme),
      });
      await themeInput.click();
      await themeInput.fill(
        "This is a very long theme that exceeds the maximum length of fifty characters",
      );
      await userEvent.tab(); // Trigger onBlur validation

      // Wait for validation errors to appear
      await expect
        .element(page.getByText(enMessages.Game.errors.titleTooLong))
        .toBeVisible();
      await expect
        .element(page.getByText(enMessages.Game.errors.themeTooLong))
        .toBeVisible();
    });

    it("verifies generate button is disabled without title and theme", async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <CreateGamePage />
        </NextIntlClientProvider>,
      );

      // Check that generate button is disabled
      const generateButton = page.getByRole("button", {
        name: enMessages.Game.generateSubjectsWithAI,
      });
      await expect.element(generateButton).toBeDisabled();

      // Verify fetch was not called
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("fills in title and theme and verifies form values", async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <CreateGamePage />
        </NextIntlClientProvider>,
      );

      // Fill in title and theme
      const titleInput = page.getByRole("textbox", {
        name: new RegExp(enMessages.Game.title),
      });
      await titleInput.click();
      await titleInput.fill("Test Game");
      await userEvent.tab(); // Trigger onBlur validation

      const themeInput = page.getByRole("textbox", {
        name: new RegExp(enMessages.Game.theme),
      });
      await themeInput.click();
      await themeInput.fill("Test Theme");
      await userEvent.tab(); // Trigger onBlur validation

      await expect.element(titleInput).toHaveValue("Test Game");
      await expect.element(themeInput).toHaveValue("Test Theme");

      // Get the generate button
      const generateButton = page.getByRole("button", {
        name: enMessages.Game.generateSubjectsWithAI,
      });

      // Mock the fetch response for subjects/generate
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: ["Subject 1", "Subject 2", "Subject 3"],
        }),
      });

      // Mock the fetch response for subjects/check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
        }),
      });

      // Click generate button
      await generateButton.click();

      // Verify that fetch was called with the correct parameters
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/subjects/generate",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            title: "Test Game",
            theme: "Test Theme",
            numberOfCandidates: 30,
          }),
        }),
      );
    });
  });

  describe("with Japanese locale", () => {
    it("renders the page title and form in Japanese", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <CreateGamePage />
        </NextIntlClientProvider>,
      );

      // Check for page title
      await expect
        .element(page.getByRole("heading", { level: 1 }))
        .toHaveTextContent(jaMessages.Game.createNew);

      // Check for form fields
      await expect
        .element(
          page.getByRole("textbox", {
            name: new RegExp(jaMessages.Game.title),
          }),
        )
        .toBeVisible();

      await expect
        .element(
          page.getByRole("textbox", {
            name: new RegExp(jaMessages.Game.theme),
          }),
        )
        .toBeVisible();

      // Check for generate button
      await expect
        .element(
          page.getByRole("button", {
            name: jaMessages.Game.generateSubjectsWithAI,
          }),
        )
        .toBeVisible();

      // Check for submit button
      await expect
        .element(page.getByRole("button", { name: jaMessages.Game.create }))
        .toBeVisible();
    });

    it("renders the page in Japanese with correct translations", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <CreateGamePage />
        </NextIntlClientProvider>,
      );

      // Check for page title
      await expect
        .element(page.getByRole("heading", { level: 1 }))
        .toHaveTextContent(jaMessages.Game.createNew);

      // Check for form fields
      await expect
        .element(
          page.getByRole("textbox", {
            name: new RegExp(jaMessages.Game.title),
          }),
        )
        .toBeVisible();

      await expect
        .element(
          page.getByRole("textbox", {
            name: new RegExp(jaMessages.Game.theme),
          }),
        )
        .toBeVisible();

      // Check for generate button
      await expect
        .element(
          page.getByRole("button", {
            name: jaMessages.Game.generateSubjectsWithAI,
          }),
        )
        .toBeVisible();

      // Check for submit button
      await expect
        .element(page.getByRole("button", { name: jaMessages.Game.create }))
        .toBeVisible();
    });
  });
});
