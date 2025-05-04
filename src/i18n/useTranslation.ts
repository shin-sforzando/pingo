"use client";

import { useLocale } from "./LocaleContext";
import enDict from "./locales/en.json";
import jaDict from "./locales/ja.json";

// Dictionary type based on the structure of our translation files
type Dictionary = typeof jaDict;

// Create a type for nested keys with dot notation
type NestedKeyOf<T> = {
  [K in keyof T & (string | number)]: T[K] extends object
    ? `${K}.${NestedKeyOf<T[K]>}`
    : K;
}[keyof T & (string | number)];

// Dictionary mapping for each supported locale
const dictionaries: Record<string, Dictionary> = {
  ja: jaDict,
  en: enDict,
};

/**
 * Hook for accessing translations
 * Provides translation function and locale management
 */
export function useTranslation() {
  const { locale, setLocale } = useLocale();

  // Get the dictionary for the current locale
  const dictionary = dictionaries[locale];

  /**
   * Translate a key to the current locale
   * Supports nested keys with dot notation (e.g., 'common.title')
   */
  function t(key: NestedKeyOf<typeof jaDict>) {
    // Split the key by dots to handle nested properties
    const path = key.split(".");

    // Navigate through the dictionary using the path
    const result = path.reduce<unknown>(
      (obj, key) =>
        typeof obj === "object" && obj !== null
          ? (obj as Record<string, unknown>)?.[key]
          : undefined,
      dictionary as Record<string, unknown>,
    );

    // If translation is missing, return the key and log a warning
    if (typeof result !== "string") {
      console.warn(`Translation missing: ${key}`);
      return key;
    }

    return result as string;
  }

  return { t, locale, setLocale };
}
