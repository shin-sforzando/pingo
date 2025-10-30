import { page } from "@vitest/browser/context";
import { beforeEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { TermsPageContent } from "./content";

describe("TermsPage", () => {
  beforeEach(() => {
    // No mocks needed - testing static content
  });

  it("renders the page with both Japanese and English headings", async () => {
    render(<TermsPageContent />);

    // Check for main headings
    await expect
      .element(page.getByRole("heading", { name: "Pingo 利用規約" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "Pingo Terms of Service" }))
      .toBeVisible();
  });

  describe("Japanese section", () => {
    it("renders Japanese table of contents with navigation", async () => {
      render(<TermsPageContent />);

      // Check for Japanese TOC with aria-label
      const jaNav = page.getByRole("navigation", { name: "目次" });
      await expect.element(jaNav).toBeVisible();

      // Open the details element to access links
      const jaSummary = jaNav.getByText("目次");
      await jaSummary.click();

      // Check for article links in TOC after opening
      await expect
        .element(page.getByRole("link", { name: /目的および適用/ }))
        .toBeVisible();
      await expect
        .element(page.getByRole("link", { name: /定義/ }))
        .toBeVisible();
      await expect
        .element(page.getByRole("link", { name: /準拠法および裁判管轄/ }))
        .toBeVisible();
    });

    it("renders all 13 Japanese article headings", async () => {
      render(<TermsPageContent />);

      // Verify key articles exist by their heading text
      await expect
        .element(page.getByRole("heading", { name: /第1条.*目的および適用/ }))
        .toBeVisible();
      await expect
        .element(page.getByRole("heading", { name: /第2条.*定義/ }))
        .toBeVisible();
      await expect
        .element(
          page.getByRole("heading", {
            name: /第3条.*登録およびアカウント管理/,
          }),
        )
        .toBeVisible();
      await expect
        .element(page.getByRole("heading", { name: /第4条.*禁止事項/ }))
        .toBeVisible();
      await expect
        .element(
          page.getByRole("heading", { name: /第5条.*投稿データの取扱い/ }),
        )
        .toBeVisible();
      await expect
        .element(
          page.getByRole("heading", {
            name: /第6条.*個人情報およびプライバシー/,
          }),
        )
        .toBeVisible();
      await expect
        .element(
          page.getByRole("heading", {
            name: /第7条.*サービスの変更.*中断.*終了/,
          }),
        )
        .toBeVisible();
      await expect
        .element(page.getByRole("heading", { name: /第8条.*免責事項/ }))
        .toBeVisible();
      await expect
        .element(page.getByRole("heading", { name: /第9条.*損害賠償/ }))
        .toBeVisible();
      await expect
        .element(
          page.getByRole("heading", { name: /第10条.*著作権および知的財産権/ }),
        )
        .toBeVisible();
      await expect
        .element(
          page.getByRole("heading", { name: /第11条.*利用停止および登録抹消/ }),
        )
        .toBeVisible();
      await expect
        .element(page.getByRole("heading", { name: /第12条.*規約の変更/ }))
        .toBeVisible();
      await expect
        .element(
          page.getByRole("heading", { name: /第13条.*準拠法および裁判管轄/ }),
        )
        .toBeVisible();
    });

    it("has semantic HTML with lang attribute", async () => {
      render(<TermsPageContent />);

      // Check for Japanese section with data-testid
      const jaSection = page.getByTestId("japanese-terms-section");
      await expect.element(jaSection).toHaveAttribute("lang", "ja");
    });
  });

  describe("English section", () => {
    it("renders English table of contents with navigation", async () => {
      render(<TermsPageContent />);

      // Check for English TOC with aria-label
      const enNav = page.getByRole("navigation", { name: "Table of Contents" });
      await expect.element(enNav).toBeVisible();

      // Open the details element to access links
      const enSummary = enNav.getByText("Table of Contents");
      await enSummary.click();

      // Check for article links in TOC after opening
      await expect
        .element(page.getByRole("link", { name: /Purpose and Applicability/ }))
        .toBeVisible();
      await expect
        .element(page.getByRole("link", { name: /Definitions/ }))
        .toBeVisible();
      await expect
        .element(
          page.getByRole("link", { name: /Governing Law and Jurisdiction/ }),
        )
        .toBeVisible();
    });

    it("renders all 13 English article headings", async () => {
      render(<TermsPageContent />);

      // Verify key articles exist by their heading text
      await expect
        .element(
          page.getByRole("heading", {
            name: /Article 1.*Purpose and Applicability/,
          }),
        )
        .toBeVisible();
      await expect
        .element(page.getByRole("heading", { name: /Article 2.*Definitions/ }))
        .toBeVisible();
      await expect
        .element(
          page.getByRole("heading", {
            name: /Article 3.*Registration and Account Management/,
          }),
        )
        .toBeVisible();
      await expect
        .element(
          page.getByRole("heading", { name: /Article 4.*Prohibited Acts/ }),
        )
        .toBeVisible();
      await expect
        .element(
          page.getByRole("heading", {
            name: /Article 5.*Handling of Posted Data/,
          }),
        )
        .toBeVisible();
      await expect
        .element(
          page.getByRole("heading", {
            name: /Article 6.*Personal Information and Privacy/,
          }),
        )
        .toBeVisible();
      await expect
        .element(
          page.getByRole("heading", {
            name: /Article 7.*Changes.*Suspension.*Termination/,
          }),
        )
        .toBeVisible();
      await expect
        .element(page.getByRole("heading", { name: /Article 8.*Disclaimer/ }))
        .toBeVisible();
      await expect
        .element(page.getByRole("heading", { name: /Article 9.*Damages/ }))
        .toBeVisible();
      await expect
        .element(
          page.getByRole("heading", {
            name: /Article 10.*Copyright and Intellectual Property Rights/,
          }),
        )
        .toBeVisible();
      await expect
        .element(
          page.getByRole("heading", {
            name: /Article 11.*Suspension and Deletion of Registration/,
          }),
        )
        .toBeVisible();
      await expect
        .element(
          page.getByRole("heading", { name: /Article 12.*Changes to Terms/ }),
        )
        .toBeVisible();
      await expect
        .element(
          page.getByRole("heading", {
            name: /Article 13.*Governing Law and Jurisdiction/,
          }),
        )
        .toBeVisible();
    });

    it("has semantic HTML with lang attribute", async () => {
      render(<TermsPageContent />);

      // Check for English section with data-testid
      const enSection = page.getByTestId("english-terms-section");
      await expect.element(enSection).toHaveAttribute("lang", "en");
    });
  });

  describe("Table of Contents functionality", () => {
    it("TOC links have correct href attributes for Japanese articles", async () => {
      render(<TermsPageContent />);

      // Open the Japanese TOC details element
      const jaNav = page.getByRole("navigation", { name: "目次" });
      const jaSummary = jaNav.getByText("目次");
      await jaSummary.click();

      // Check that TOC links have correct href attributes
      const link1 = page.getByRole("link", { name: /目的および適用/ });
      await expect.element(link1).toHaveAttribute("href", "#article-1-ja");

      const link2 = page.getByRole("link", { name: /^定義$/ });
      await expect.element(link2).toHaveAttribute("href", "#article-2-ja");

      const link13 = page.getByRole("link", { name: /準拠法および裁判管轄/ });
      await expect.element(link13).toHaveAttribute("href", "#article-13-ja");
    });

    it("TOC links have correct href attributes for English articles", async () => {
      render(<TermsPageContent />);

      // Open the English TOC details element
      const enNav = page.getByRole("navigation", { name: "Table of Contents" });
      const enSummary = enNav.getByText("Table of Contents");
      await enSummary.click();

      // Check that TOC links have correct href attributes
      const link1 = page.getByRole("link", {
        name: /Purpose and Applicability/,
      });
      await expect.element(link1).toHaveAttribute("href", "#article-1-en");

      const link2 = page.getByRole("link", { name: /^Definitions$/ });
      await expect.element(link2).toHaveAttribute("href", "#article-2-en");

      const link13 = page.getByRole("link", {
        name: /Governing Law and Jurisdiction/,
      });
      await expect.element(link13).toHaveAttribute("href", "#article-13-en");
    });
  });

  describe("Semantic HTML structure", () => {
    it("uses navigation elements for TOCs", async () => {
      render(<TermsPageContent />);

      // Check for navigation elements (2 TOCs: Japanese and English)
      const navElements = await page.getByRole("navigation").all();
      expect(navElements.length).toBe(2);
    });

    it("renders company information in footer", async () => {
      render(<TermsPageContent />);

      // Check for company name and effective date in footer (using more specific selectors)
      await expect
        .element(page.getByText("施行日：2025年10月23日"))
        .toBeInTheDocument();
      await expect
        .element(page.getByText("Effective Date: October 23, 2025"))
        .toBeInTheDocument();

      // Use getByRole("contentinfo") to find footer, then search within it
      const footers = await page.getByText("合同会社はっきんぐパパ").all();
      expect(footers.length).toBeGreaterThan(0);
    });
  });
});
