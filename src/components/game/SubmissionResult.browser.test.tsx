import { page } from "@vitest/browser/context";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { AcceptanceStatus } from "@/types/common";
import enMessages from "../../../messages/en.json";
import jaMessages from "../../../messages/ja.json";
import { SubmissionResult } from "./SubmissionResult";

const renderWithIntl = (component: React.ReactElement, locale: "en" | "ja") => {
  const messages = locale === "en" ? enMessages : jaMessages;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {component}
    </NextIntlClientProvider>,
  );
};

describe("SubmissionResult", () => {
  const defaultProps = {
    confidence: 0.85,
    critique_ja: "テスト用の分析メッセージ",
    critique_en: "Test critique message",
    acceptanceStatus: AcceptanceStatus.ACCEPTED,
    confidenceThreshold: 0.7,
  };

  describe("with Japanese locale", () => {
    it("renders the component with basic props", async () => {
      renderWithIntl(<SubmissionResult {...defaultProps} />, "ja");

      await expect
        .element(page.getByText(jaMessages.Game.SubmissionResult.title))
        .toBeVisible();
      await expect
        .element(
          page
            .getByText(jaMessages.Game.SubmissionResult.status.accepted)
            .first(),
        )
        .toBeVisible();
      await expect
        .element(page.getByText("テスト用の分析メッセージ"))
        .toBeVisible();
    });

    it("displays confidence percentage correctly", async () => {
      renderWithIntl(<SubmissionResult {...defaultProps} />, "ja");

      const expectedText = jaMessages.Game.SubmissionResult.confidence
        .replace("{confidence}", "85")
        .replace("{threshold}", "70");
      await expect.element(page.getByText(expectedText)).toBeVisible();
    });

    it("shows matched cell info when accepted", async () => {
      renderWithIntl(
        <SubmissionResult
          {...defaultProps}
          acceptanceStatus={AcceptanceStatus.ACCEPTED}
          matchedCellSubject="りんご"
        />,
        "ja",
      );

      await expect
        .element(page.getByText(jaMessages.Game.SubmissionResult.matchedCell))
        .toBeVisible();
      await expect.element(page.getByText("りんご")).toBeVisible();
    });

    it("does not show matched cell info when not accepted", async () => {
      renderWithIntl(
        <SubmissionResult
          {...defaultProps}
          acceptanceStatus={AcceptanceStatus.NO_MATCH}
          matchedCellSubject="りんご"
        />,
        "ja",
      );

      await expect
        .element(page.getByText(jaMessages.Game.SubmissionResult.matchedCell))
        .not.toBeInTheDocument();
      await expect.element(page.getByText("りんご")).not.toBeInTheDocument();
    });

    it("displays correct status for no_match", async () => {
      renderWithIntl(
        <SubmissionResult
          {...defaultProps}
          acceptanceStatus={AcceptanceStatus.NO_MATCH}
        />,
        "ja",
      );

      await expect
        .element(
          page.getByText(jaMessages.Game.SubmissionResult.status.no_match),
        )
        .toBeVisible();
    });

    it("displays correct status for inappropriate_content", async () => {
      renderWithIntl(
        <SubmissionResult
          {...defaultProps}
          acceptanceStatus={AcceptanceStatus.INAPPROPRIATE_CONTENT}
        />,
        "ja",
      );

      await expect
        .element(
          page.getByText(
            jaMessages.Game.SubmissionResult.status.inappropriate_content,
          ),
        )
        .toBeVisible();
    });

    it("displays threshold note correctly", async () => {
      renderWithIntl(
        <SubmissionResult {...defaultProps} confidenceThreshold={0.8} />,
        "ja",
      );

      const expectedText =
        jaMessages.Game.SubmissionResult.thresholdNote.replace(
          "{threshold}",
          "80",
        );
      await expect.element(page.getByText(expectedText)).toBeVisible();
    });
  });

  describe("with English locale", () => {
    it("renders the component with basic props", async () => {
      renderWithIntl(<SubmissionResult {...defaultProps} />, "en");

      await expect
        .element(page.getByText(enMessages.Game.SubmissionResult.title))
        .toBeVisible();
      await expect
        .element(
          page.getByText(enMessages.Game.SubmissionResult.status.accepted),
        )
        .toBeVisible();
      await expect
        .element(page.getByText("Test critique message"))
        .toBeVisible();
    });

    it("displays confidence percentage correctly", async () => {
      renderWithIntl(<SubmissionResult {...defaultProps} />, "en");

      const expectedText = enMessages.Game.SubmissionResult.confidence
        .replace("{confidence}", "85")
        .replace("{threshold}", "70");
      await expect.element(page.getByText(expectedText)).toBeVisible();
    });

    it("shows matched cell info when accepted", async () => {
      renderWithIntl(
        <SubmissionResult
          {...defaultProps}
          acceptanceStatus={AcceptanceStatus.ACCEPTED}
          matchedCellSubject="Apple"
        />,
        "en",
      );

      await expect
        .element(page.getByText(enMessages.Game.SubmissionResult.matchedCell))
        .toBeVisible();
      await expect.element(page.getByText("Apple")).toBeVisible();
    });

    it("does not show matched cell info when not accepted", async () => {
      renderWithIntl(
        <SubmissionResult
          {...defaultProps}
          acceptanceStatus={AcceptanceStatus.NO_MATCH}
          matchedCellSubject="Apple"
        />,
        "en",
      );

      await expect
        .element(page.getByText(enMessages.Game.SubmissionResult.matchedCell))
        .not.toBeInTheDocument();
      await expect.element(page.getByText("Apple")).not.toBeInTheDocument();
    });

    it("displays correct status for no_match", async () => {
      renderWithIntl(
        <SubmissionResult
          {...defaultProps}
          acceptanceStatus={AcceptanceStatus.NO_MATCH}
        />,
        "en",
      );

      await expect
        .element(
          page.getByText(enMessages.Game.SubmissionResult.status.no_match),
        )
        .toBeVisible();
    });

    it("displays correct status for inappropriate_content", async () => {
      renderWithIntl(
        <SubmissionResult
          {...defaultProps}
          acceptanceStatus={AcceptanceStatus.INAPPROPRIATE_CONTENT}
        />,
        "en",
      );

      await expect
        .element(
          page.getByText(
            enMessages.Game.SubmissionResult.status.inappropriate_content,
          ),
        )
        .toBeVisible();
    });

    it("displays threshold note correctly", async () => {
      renderWithIntl(
        <SubmissionResult {...defaultProps} confidenceThreshold={0.8} />,
        "en",
      );

      const expectedText =
        enMessages.Game.SubmissionResult.thresholdNote.replace(
          "{threshold}",
          "80",
        );
      await expect.element(page.getByText(expectedText)).toBeVisible();
    });
  });

  describe("common functionality", () => {
    it("applies custom className", async () => {
      const { container } = renderWithIntl(
        <SubmissionResult {...defaultProps} className="custom-class" />,
        "en",
      );

      await expect
        .element(container.firstChild as HTMLElement)
        .toHaveClass("custom-class");
    });

    it("handles edge case with 0% confidence", async () => {
      renderWithIntl(
        <SubmissionResult {...defaultProps} confidence={0} />,
        "en",
      );

      const expectedText = enMessages.Game.SubmissionResult.confidence
        .replace("{confidence}", "0")
        .replace("{threshold}", "70");
      await expect.element(page.getByText(expectedText)).toBeVisible();
    });

    it("handles edge case with 100% confidence", async () => {
      renderWithIntl(
        <SubmissionResult {...defaultProps} confidence={1} />,
        "en",
      );

      const expectedText = enMessages.Game.SubmissionResult.confidence
        .replace("{confidence}", "100")
        .replace("{threshold}", "70");
      await expect.element(page.getByText(expectedText)).toBeVisible();
    });

    it("rounds confidence percentage correctly", async () => {
      renderWithIntl(
        <SubmissionResult {...defaultProps} confidence={0.856} />,
        "en",
      );

      const expectedText = enMessages.Game.SubmissionResult.confidence
        .replace("{confidence}", "86")
        .replace("{threshold}", "70");
      await expect.element(page.getByText(expectedText)).toBeVisible();
    });
  });
});
