"use server";

import { type Locale, defaultLocale } from "@/i18n/config";
import { cookies } from "next/headers";

const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export async function getUserLocale() {
  return (await cookies()).get(LOCALE_COOKIE_NAME)?.value || defaultLocale;
}

export async function setUserLocale(locale: Locale) {
  (await cookies()).set(LOCALE_COOKIE_NAME, locale);
}

export async function clearUserLocale() {
  (await cookies()).delete(LOCALE_COOKIE_NAME);
}
