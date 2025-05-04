"use client";

import { LOCALES, LOCALE_NAMES } from "@/i18n/config";
import { useTranslation } from "@/i18n/useTranslation";

/**
 * Language switcher component
 * Allows users to toggle between available languages
 */
export function LanguageSwitcher() {
  const { t, locale, setLocale } = useTranslation();

  // Toggle between Japanese and English
  const toggleLanguage = () => {
    setLocale(locale === LOCALES.JA ? LOCALES.EN : LOCALES.JA);
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
      aria-label={t("common.language")}
    >
      {locale === LOCALES.JA
        ? LOCALE_NAMES[LOCALES.EN]
        : LOCALE_NAMES[LOCALES.JA]}
    </button>
  );
}
