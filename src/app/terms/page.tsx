import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TermsPageContent } from "./content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("Terms.pageTitle"),
    description: t("Terms.pageDescription"),
  };
}

/**
 * Why: Async wrapper for Server Component
 * Why: Allows metadata generation while keeping content testable
 * Why: Content component is in separate file for testing
 */
export default async function TermsPage() {
  return <TermsPageContent />;
}
