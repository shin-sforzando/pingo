"use client";

import { Button } from "@/components/ui/button";
import { setUserLocale } from "@/services/locale";
import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

export function LanguageSwitcher() {
  const router = useRouter();
  const locale = useLocale();

  // Display the opposite language of the current locale
  const languageText = locale === "ja" ? "English" : "日本語";

  const toggleLocale = async () => {
    const newLocale = locale === "ja" ? "en" : "ja";
    await setUserLocale(newLocale);

    // Refresh the page to apply the new locale
    router.refresh();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="justify-start"
      onClick={toggleLocale}
    >
      <Languages className="mr-2 h-4 w-4" />
      {languageText}
    </Button>
  );
}
