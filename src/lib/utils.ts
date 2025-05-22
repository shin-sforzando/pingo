import { type ClassValue, clsx } from "clsx";
import { format, formatRelative } from "date-fns";
import { enUS, ja } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

/**
 * Combines and merges class names, resolving Tailwind CSS conflicts.
 *
 * Accepts any number of class name values, conditionally combines them, and merges Tailwind CSS classes to eliminate duplicates and resolve conflicts.
 *
 * @param inputs - Class name values to combine and merge.
 * @returns A single string of merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date object or timestamp to a localized string.
 *
 * @param date - Date object, timestamp, or Firestore timestamp
 * @param formatStr - Optional format string (default: 'PPP')
 * @param locale - Optional locale string (default: 'ja')
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | number | { toDate: () => Date } | null | undefined,
  formatStr = "PPP",
  locale = "ja",
) {
  if (!date) return "";

  // Handle Firestore Timestamp objects
  const dateObj =
    typeof date === "object" && "toDate" in date ? date.toDate() : date;

  try {
    return format(dateObj, formatStr, {
      locale: locale === "ja" ? ja : enUS,
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
}

/**
 * Formats a date relative to the current date (e.g., "yesterday", "2 days ago").
 *
 * @param date - Date object, timestamp, or Firestore timestamp
 * @param locale - Optional locale string (default: 'ja')
 * @returns Relative date string
 */
export function formatRelativeDate(
  date: Date | number | { toDate: () => Date } | null | undefined,
  locale = "ja",
) {
  if (!date) return "";

  // Handle Firestore Timestamp objects
  const dateObj =
    typeof date === "object" && "toDate" in date ? date.toDate() : date;

  try {
    return formatRelative(dateObj, new Date(), {
      locale: locale === "ja" ? ja : enUS,
    });
  } catch (error) {
    console.error("Error formatting relative date:", error);
    return "";
  }
}
