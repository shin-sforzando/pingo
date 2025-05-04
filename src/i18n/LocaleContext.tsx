"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { DEFAULT_LOCALE, LOCALES, type LocaleType } from "./config";

type LocaleContextType = {
  locale: LocaleType;
  setLocale: (locale: LocaleType) => void;
};

// Create context with undefined default value
const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

/**
 * Provider component for locale context
 * Manages locale state and persists it in cookies
 */
export function LocaleProvider({
  children,
  defaultLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  defaultLocale?: LocaleType;
}) {
  const [locale, setLocale] = useState<LocaleType>(defaultLocale);

  // Save locale to cookie and update HTML lang attribute
  const saveLocale = useCallback((newLocale: LocaleType) => {
    setLocale(newLocale);
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;

    // Update HTML lang attribute dynamically
    document.documentElement.lang = newLocale;
  }, []);

  // On initial render, load locale from cookie or detect from browser
  useEffect(() => {
    const savedLocale = document.cookie
      .split("; ")
      .find((row) => row.startsWith("NEXT_LOCALE="))
      ?.split("=")[1];

    if (
      savedLocale &&
      (savedLocale === LOCALES.JA || savedLocale === LOCALES.EN)
    ) {
      setLocale(savedLocale as LocaleType);
      document.documentElement.lang = savedLocale;
    } else {
      // Detect browser language, default to Japanese if not English
      const browserLang = navigator.language.split("-")[0].toLowerCase();
      const detectedLocale = browserLang === "en" ? LOCALES.EN : LOCALES.JA;
      saveLocale(detectedLocale);
    }
  }, [saveLocale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale: saveLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

/**
 * Hook to access locale context
 * Must be used within a LocaleProvider
 */
export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
