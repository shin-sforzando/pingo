"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { LanguageSwitcher } from "./LanguageSwitcher";

/**
 * Sample component that demonstrates i18n functionality
 * Shows translated text and includes a language switcher
 */
export function TranslatedText() {
  const { t } = useTranslation();

  return (
    <div className="p-4 border rounded-md max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{t("common.title")}</h2>
        <LanguageSwitcher />
      </div>

      <p className="mb-4">{t("common.description")}</p>

      <h3 className="text-lg font-semibold mb-2">{t("navigation.home")}</h3>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          type="button"
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          {t("actions.submit")}
        </button>
        <button
          type="button"
          className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
        >
          {t("actions.cancel")}
        </button>
      </div>

      <div className="text-sm text-gray-500">
        <p>{t("game.create")}</p>
        <p>{t("game.join")}</p>
      </div>
    </div>
  );
}
