import { useTranslations } from "next-intl";
import Link from "next/link";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const t = useTranslations("Common");

  return (
    <header className="sticky top-0 z-50 w-full bg-background/70 backdrop-invert">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between px-4">
        <div className="hidden flex-1" />

        {/* System name - centered */}
        <div className="flex flex-1 justify-center" data-testid="app-name">
          <Link href="/" className="font-black text-4xl">
            {t("appName")}
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
