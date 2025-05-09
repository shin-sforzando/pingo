"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationDrawer } from "./NotificationDrawer";
import { UserMenu } from "./UserMenu";

export function Header() {
  const [notificationOpen, setNotificationOpen] = useState(false);
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

        {/* Right side icons */}
        <div className="flex flex-1 items-center justify-end gap-2">
          {user ? (
            <>
              {/* Notification button - only shown when authenticated */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setNotificationOpen(true)}
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </Button>

              {/* User avatar - only shown when authenticated */}
              <UserMenu />
            </>
          ) : (
            /* Language switcher - shown when not authenticated */
            <LanguageSwitcher />
          )}
        </div>
      </div>

      {/* Notification Drawer - only functional when authenticated */}
      {user && (
        <NotificationDrawer
          open={notificationOpen}
          onOpenChange={setNotificationOpen}
        />
      )}
    </header>
  );
}
