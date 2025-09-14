"use client";

import { Languages, LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { setUserLocale } from "@/services/locale";

export function UserMenu(): ReactElement {
  const { user, logout } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Header");
  const commonT = useTranslations("Common");

  const toggleLocale = async (): Promise<void> => {
    try {
      const newLocale = locale === "ja" ? "en" : "ja";
      await setUserLocale(newLocale);
      router.refresh();
    } catch (error) {
      console.error("Failed to switch language:", error);
    }
  };

  const userInitial = user?.username.charAt(0).toUpperCase() || "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          <AvatarFallback>{userInitial}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{user?.username}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <UserIcon className="mr-2 h-4 w-4" />
              {t("profile")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleLocale}>
            <Languages className="mr-2 h-4 w-4" />
            {commonT("toLanguage")}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {user?.participatingGames && 0 < user.participatingGames.length && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t("recentGames")}</DropdownMenuLabel>
            {user.participatingGames.slice(0, 10).map((gameId) => (
              <DropdownMenuItem key={gameId} asChild>
                <Link href={`/game/${gameId}`}>
                  Game {gameId.substring(0, 8)}...
                </Link>
              </DropdownMenuItem>
            ))}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()} variant="destructive">
          <LogOut className="mr-2 h-4 w-4" />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
