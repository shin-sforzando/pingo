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
import { useParticipatingGames } from "@/hooks/useParticipatingGames";
import { setUserLocale } from "@/services/locale";

export function UserMenu(): ReactElement {
  const { user, logout } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const headerT = useTranslations("Header");
  const commonT = useTranslations("Common");

  // Fetch participating games using custom hook (lightweight mode for menu)
  const { participatingGames } = useParticipatingGames(user, {
    fetchDetails: false,
  });

  const toggleLocale = async (): Promise<void> => {
    try {
      const newLocale = locale === "ja" ? "en" : "ja";
      await setUserLocale(newLocale);
      router.refresh();
    } catch (error) {
      console.error("Failed to switch language:", error);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      // Redirect to homepage after successful logout
      router.push("/");
    } catch (error) {
      console.error("Failed to logout:", error);
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
              {headerT("profile")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleLocale}>
            <Languages className="mr-2 h-4 w-4" />
            {commonT("toLanguage")}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {participatingGames.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{headerT("recentGames")}</DropdownMenuLabel>
            {participatingGames.slice(0, 10).map((game) => {
              const displayText = `${game.title} (${game.id})`;

              return (
                <DropdownMenuItem key={game.id} asChild>
                  <Link href={`/game/${game.id}`}>{displayText}</Link>
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} variant="destructive">
          <LogOut className="mr-2 h-4 w-4" />
          {headerT("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
