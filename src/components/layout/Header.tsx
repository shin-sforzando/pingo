"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationIcon } from "./NotificationIcon";
import { UserMenu } from "./UserMenu";

export function Header(): ReactElement {
  const t = useTranslations("Common");
  const { user } = useAuth();

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
          {user ? (
            <>
              <NotificationIcon hasUnreadNotifications={true} />
              <UserMenu />
            </>
          ) : (
            <LanguageSwitcher />
          )}
        </div>
      </div>
    </header>
  );
}
