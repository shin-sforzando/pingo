import { page } from "@vitest/browser/context";
import { NextIntlClientProvider } from "next-intl";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { Footer } from "./Footer";

import enMessages from "../../../messages/en.json";
import jaMessages from "../../../messages/ja.json";

// Mock next/image and next/link
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    width,
    height,
    className,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className: string;
  }) => (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      data-testid="hacking-papa-image"
    />
  ),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    className,
    children,
    target,
    rel,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
    target?: string;
    rel?: string;
  }) => (
    <a href={href} className={className} target={target} rel={rel}>
      {children}
    </a>
  ),
}));

describe("Footer", () => {
  it("renders without crashing", () => {
    expect(() => (
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <Footer />
      </NextIntlClientProvider>
    )).not.toThrow();
  });

  describe("with Japanese locale", () => {
    it("displays the copyright notice with fixed year (2025)", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <Footer />
        </NextIntlClientProvider>,
      );

      const copyright = page.getByText(
        jaMessages.Footer.copyright.replace("{year}", "2025"),
      );
      await expect.element(copyright).toBeVisible();
    });

    it("displays the terms of service link", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <Footer />
        </NextIntlClientProvider>,
      );

      const termsLink = page.getByRole("link", {
        name: jaMessages.Footer.termsOfService,
      });
      await expect.element(termsLink).toBeVisible();
      await expect.element(termsLink).toHaveAttribute("href", "/terms");
    });

    it("displays the Hacking Papa image with link", async () => {
      render(
        <NextIntlClientProvider locale="ja" messages={jaMessages}>
          <Footer />
        </NextIntlClientProvider>,
      );

      const image = page.getByTestId("hacking-papa-image");
      await expect.element(image).toBeVisible();
      await expect
        .element(image)
        .toHaveAttribute("src", "/images/hacking-papa_512x512.png");
      await expect.element(image).toHaveAttribute("alt", "Hacking Papa");

      // Check if the image is wrapped in a link to hacking-papa.com
      const imageLink = page.getByRole("link", { name: "Hacking Papa" });
      await expect.element(imageLink).toBeVisible();
      await expect
        .element(imageLink)
        .toHaveAttribute("href", "https://hacking-papa.com");
      await expect.element(imageLink).toHaveAttribute("target", "_blank");
      await expect
        .element(imageLink)
        .toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("with English locale", () => {
    it("displays the copyright notice with fixed year (2025)", async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <Footer />
        </NextIntlClientProvider>,
      );

      const copyright = page.getByText(
        enMessages.Footer.copyright.replace("{year}", "2025"),
      );
      await expect.element(copyright).toBeVisible();
    });

    it("displays the terms of service link", async () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <Footer />
        </NextIntlClientProvider>,
      );

      const termsLink = page.getByRole("link", {
        name: enMessages.Footer.termsOfService,
      });
      await expect.element(termsLink).toBeVisible();
      await expect.element(termsLink).toHaveAttribute("href", "/terms");
    });
  });
});
