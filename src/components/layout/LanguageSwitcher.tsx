"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { setUserLocale } from "@/services/locale";

export function LanguageSwitcher() {
  const router = useRouter();
  const locale = useLocale();

  const LOCALE_JA = "ja";
  const LOCALE_EN = "en";

  const t = useTranslations();

  const toggleLocale = async () => {
    try {
      const newLocale = locale === LOCALE_JA ? LOCALE_EN : LOCALE_JA;
      await setUserLocale(newLocale);

      // Refresh the page to apply the new locale
      router.refresh();
    } catch (error) {
      console.error("Failed to switch language:", error);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="justify-start"
      onClick={toggleLocale}
    >
      <Languages className="mr-2 h-4 w-4" />
      {t("Common.toLanguage")}
    </Button>
  );
}
