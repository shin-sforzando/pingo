"use client";

import { useTranslations } from "next-intl";

interface LocalizedHeadingProps {
  /**
   * The size of the heading
   */
  size?: "small" | "medium" | "large";
}

/**
 * A simple heading component that uses translations
 */
export default function LocalizedHeading({
  size = "medium",
}: LocalizedHeadingProps) {
  // Use translations from the HomePage namespace
  const t = useTranslations("HomePage");

  // Define size classes for different heading sizes
  const sizeClasses = {
    small: "text-lg font-medium",
    medium: "text-2xl font-bold",
    large: "text-4xl font-bold",
  };

  return (
    <h1 className={sizeClasses[size]}>
      {t("welcome")} {t("title")}
    </h1>
  );
}
