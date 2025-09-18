"use client";

import { Languages, LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
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
import { auth } from "@/lib/firebase/client";
import { setUserLocale } from "@/services/locale";
import type { Game } from "@/types/schema";

export function UserMenu(): ReactElement {
  const { user, logout } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const headerT = useTranslations("Header");
  const commonT = useTranslations("Common");
  const [gameInfos, setGameInfos] = useState<
    Record<string, Pick<Game, "id" | "title">>
  >({});

  // Fetch game information for participating games
  useEffect(() => {
    const fetchGameInfos = async () => {
      if (!user?.participatingGames || user.participatingGames.length === 0) {
        return;
      }

      const infos: Record<string, Pick<Game, "id" | "title">> = {};

      // Fetch game information for each participating game
      await Promise.all(
        user.participatingGames.map(async (gameId) => {
          try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) return;

            const response = await fetch(`/api/game/${gameId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data) {
                // Only include non-expired games
                const expiresAt = data.data.expiresAt
                  ? new Date(data.data.expiresAt)
                  : null;
                const now = new Date();
                if (!expiresAt || expiresAt > now) {
                  infos[gameId] = {
                    id: data.data.id,
                    title: data.data.title,
                  };
                }
              }
            }
            // Don't show games that return 404 or other errors
          } catch (error) {
            console.error(`Failed to fetch game info for ${gameId}:`, error);
          }
        }),
      );

      setGameInfos(infos);
    };

    fetchGameInfos();
  }, [user?.participatingGames]);

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
              {headerT("profile")}
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
            <DropdownMenuLabel>{headerT("recentGames")}</DropdownMenuLabel>
            {user.participatingGames
              .filter((gameId) => gameInfos[gameId]) // Only show games with valid info
              .slice(0, 10)
              .map((gameId) => {
                const gameInfo = gameInfos[gameId];
                const displayText = `${gameInfo.title} (${gameId})`;

                return (
                  <DropdownMenuItem key={gameId} asChild>
                    <Link href={`/game/${gameId}`}>{displayText}</Link>
                  </DropdownMenuItem>
                );
              })}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()} variant="destructive">
          <LogOut className="mr-2 h-4 w-4" />
          {headerT("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
