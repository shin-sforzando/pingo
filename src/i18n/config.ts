/**
 * Configuration for internationalization
 */

export const LOCALES = {
  JA: "ja",
  EN: "en",
} as const;

export type LocaleType = (typeof LOCALES)[keyof typeof LOCALES];

// Default locale is Japanese
export const DEFAULT_LOCALE: LocaleType = LOCALES.JA;

export const LOCALE_NAMES = {
  [LOCALES.JA]: "日本語",
  [LOCALES.EN]: "English",
} as const;
