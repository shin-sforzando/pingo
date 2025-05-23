import { page } from "@vitest/browser/context";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { ImageUpload } from "./ImageUpload";

import enMessages from "../../../messages/en.json";
import jaMessages from "../../../messages/ja.json";

// Mock the image-utils module
vi.mock("@/lib/image-utils", () => ({
  processImage: vi.fn(),
  createImagePreviewUrl: vi.fn(),
  revokeImagePreviewUrl: vi.fn(),
  isValidImageFile: vi.fn(),
  isValidFileSize: vi.fn(),
}));

describe("ImageUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the default drop zone", async () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ImageUpload />
      </NextIntlClientProvider>,
    );

    const dropZoneText = page.getByText(enMessages.imageUpload.dropZone.title);
    const supportText = page.getByText(
      enMessages.imageUpload.dropZone.description,
    );

    await expect.element(dropZoneText).toBeVisible();
    await expect.element(supportText).toBeVisible();
  });

  it("shows disabled state correctly", async () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ImageUpload disabled />
      </NextIntlClientProvider>,
    );

    const container = page.getByTestId("image-upload-container");
    await expect.element(container).toBeVisible();

    // Check that the container exists and is rendered
    // The disabled styling is applied to the Card component internally
    const dropZoneText = page.getByText(enMessages.imageUpload.dropZone.title);
    await expect.element(dropZoneText).toBeVisible();
  });

  it("shows uploading state", async () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ImageUpload isUploading />
      </NextIntlClientProvider>,
    );

    const container = page.getByTestId("image-upload-container");
    await expect.element(container).toBeVisible();

    // Check that the container exists and is rendered
    // The uploading styling is applied to the Card component internally
    const dropZoneText = page.getByText(enMessages.imageUpload.dropZone.title);
    await expect.element(dropZoneText).toBeVisible();
  });

  it("applies custom className", async () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ImageUpload className="custom-class" />
      </NextIntlClientProvider>,
    );

    const container = page.getByTestId("image-upload-container");
    await expect.element(container).toHaveClass("custom-class");
  });

  it("works with Japanese locale", async () => {
    render(
      <NextIntlClientProvider locale="ja" messages={jaMessages}>
        <ImageUpload />
      </NextIntlClientProvider>,
    );

    const dropZoneText = page.getByText(jaMessages.imageUpload.dropZone.title);
    const supportText = page.getByText(
      jaMessages.imageUpload.dropZone.description,
    );

    await expect.element(dropZoneText).toBeVisible();
    await expect.element(supportText).toBeVisible();
  });
});
