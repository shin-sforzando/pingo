import { type ClassValue, clsx } from "clsx";
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
