import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as analytics from "@/lib/analytics";
import { GoogleAnalytics } from "./GoogleAnalytics";

// Mock @next/third-parties/google
vi.mock("@next/third-parties/google", () => ({
  GoogleAnalytics: ({ gaId }: { gaId: string }) => (
    <div data-testid="next-google-analytics" data-ga-id={gaId}>
      GoogleAnalytics Component
    </div>
  ),
}));

// Mock analytics module
vi.mock("@/lib/analytics", () => ({
  hasUserConsent: vi.fn(),
}));

describe("GoogleAnalytics", () => {
  beforeEach(() => {
    // Clear localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }

    // Reset environment variables using vi.stubEnv
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST123");

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should not render when GA measurement ID is not configured", () => {
    vi.unstubAllEnvs();
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", undefined);
    vi.mocked(analytics.hasUserConsent).mockReturnValue(true);

    const { container } = render(<GoogleAnalytics />);
    expect(
      container.querySelector("[data-testid='next-google-analytics']"),
    ).toBeNull();
  });

  it("should not render when user has not consented", () => {
    vi.mocked(analytics.hasUserConsent).mockReturnValue(false);

    const { container } = render(<GoogleAnalytics />);
    expect(
      container.querySelector("[data-testid='next-google-analytics']"),
    ).toBeNull();
  });

  it("should render NextGoogleAnalytics when GA ID is configured and user has consented", () => {
    vi.mocked(analytics.hasUserConsent).mockReturnValue(true);

    const { container } = render(<GoogleAnalytics />);
    const analyticsElement = container.querySelector(
      "[data-testid='next-google-analytics']",
    );

    expect(analyticsElement).not.toBeNull();
    expect(analyticsElement?.getAttribute("data-ga-id")).toBe("G-TEST123");
  });

  it("should re-render when consent changes via storage event", async () => {
    vi.mocked(analytics.hasUserConsent).mockReturnValue(false);

    const { container, rerender } = render(<GoogleAnalytics />);

    // Initially should not render
    expect(
      container.querySelector("[data-testid='next-google-analytics']"),
    ).toBeNull();

    // Simulate consent being granted
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("pingo_analytics_consent", "granted");
    }
    vi.mocked(analytics.hasUserConsent).mockReturnValue(true);

    // Trigger storage event
    const storageEvent = new StorageEvent("storage", {
      key: "pingo_analytics_consent",
      newValue: "granted",
      oldValue: "denied",
    });
    window.dispatchEvent(storageEvent);

    // Re-render to apply the state change
    rerender(<GoogleAnalytics />);

    // Should now render
    expect(
      container.querySelector("[data-testid='next-google-analytics']"),
    ).not.toBeNull();
  });
});
