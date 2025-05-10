import type { Page } from "@playwright/test";

import enMessages from "../../messages/en.json";
import jaMessages from "../../messages/ja.json";

// Extract auth-related messages from translation files
const jaAuth = jaMessages.Auth;
const enAuth = enMessages.Auth;

/**
 * Generate a unique test username with timestamp
 * @returns A unique username for testing
 */
export function generateTestUsername(): string {
  return `test_e2e_${Date.now().toString(36)}`;
}

/**
 * Login to the application with the given credentials
 * @param page - Playwright page object
 * @param username - Username to login with
 * @param password - Password to login with
 */
export async function login(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  await page.goto("/");

  // On the home page, we should see either the login form or the register form
  // If we see "Don't have an account?" text, we're on the login form
  const registerLinkText = page.locator(
    `text=/${enAuth.dontHaveAccount}|${jaAuth.dontHaveAccount}/`,
  );
  const isLoginForm = await registerLinkText.isVisible();

  if (!isLoginForm) {
    // If we're on register form, click the login link at the bottom
    const loginLinkText = page.locator(
      `text=/${enAuth.alreadyHaveAccount}|${jaAuth.alreadyHaveAccount}/`,
    );
    if (await loginLinkText.isVisible()) {
      const loginLink = page
        .locator(`text=/${enAuth.login}|${jaAuth.login}/`)
        .last();
      await loginLink.click();
    }
  }

  // Fill in the login form - works with both languages
  await page
    .getByLabel(new RegExp(`${enAuth.username}|${jaAuth.username}`))
    .fill(username);
  await page
    .getByLabel(new RegExp(`${enAuth.password}|${jaAuth.password}`))
    .fill(password);

  // Click the login button - works with both languages
  await page
    .getByRole("button")
    .filter({
      hasText: new RegExp(`${enAuth.login}|${jaAuth.login}`),
    })
    .click();

  // Wait for the user avatar to be visible (indicates successful login)
  await page.waitForSelector('[data-testid="my-avatar"]');
}

/**
 * Register a new test user
 * @param page - Playwright page object
 * @param username - Username to register
 * @param password - Password to register
 */
export async function registerUser(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  await page.goto("/");

  // On the home page, we should see either the login form or the register form
  // If we see "Already have an account?" text, we're on the register form
  const loginLinkText = page.locator(
    `text=/${enAuth.alreadyHaveAccount}|${jaAuth.alreadyHaveAccount}/`,
  );
  const isRegisterForm = await loginLinkText.isVisible();

  if (!isRegisterForm) {
    // If we're on login form, click the register link at the bottom
    const registerLinkText = page.locator(
      `text=/${enAuth.dontHaveAccount}|${jaAuth.dontHaveAccount}/`,
    );
    if (await registerLinkText.isVisible()) {
      const registerLink = page
        .locator(`text=/${enAuth.register}|${jaAuth.register}/`)
        .last();
      await registerLink.click();
    }
  }

  // Fill in the registration form - works with both languages
  await page
    .getByLabel(new RegExp(`${enAuth.username}|${jaAuth.username}`))
    .fill(username);
  await page
    .getByLabel(new RegExp(`${enAuth.password}|${jaAuth.password}`))
    .first()
    .fill(password);
  await page
    .getByLabel(
      new RegExp(`${enAuth.confirmPassword}|${jaAuth.confirmPassword}`),
    )
    .fill(password);

  // Click the register button - works with both languages
  await page
    .getByRole("button")
    .filter({
      hasText: new RegExp(`${enAuth.register}|${jaAuth.register}`),
    })
    .first()
    .click();

  // Wait for the user avatar to be visible (indicates successful registration)
  await page.waitForSelector('[data-testid="my-avatar"]');
}

/**
 * Logout from the application
 * @param page - Playwright page object
 */
export async function logout(page: Page): Promise<void> {
  // Click on the user avatar to open the menu
  await page.getByTestId("my-avatar").click();

  // Click on the logout menu item - works with both languages
  const headerJa = jaMessages.Header;
  const headerEn = enMessages.Header;

  await page
    .getByRole("menuitem")
    .filter({
      hasText: new RegExp(`${headerEn.logout}|${headerJa.logout}`),
    })
    .click();

  // Wait for the login form to be visible (indicates successful logout)
  // We'll look for the login/register form container
  await page.waitForSelector(".max-w-md");
}
