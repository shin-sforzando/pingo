export type Locale = (typeof locales)[number];

export const locales = ["en", "ja"] as const;
export const defaultLocale: Locale = "ja" as const;
