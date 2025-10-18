"use client";

import { formatDistanceToNow } from "date-fns";
import { enUS, ja } from "date-fns/locale";
import { Calendar, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { GameInfo } from "@/types/schema";

export interface GameInfoCardProps {
  /**
   * Game information to display
   */
  game: GameInfo;
  /**
   * Callback function when card is clicked
   */
  onClick: (game: GameInfo) => void;
  /**
   * Current locale for date formatting ("ja" or "en")
   */
  locale: string;
  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * Reusable card component for displaying game information in lists
 * Used in game join page for both participating and available games
 */
export function GameInfoCard({
  game,
  onClick,
  locale,
  className,
}: GameInfoCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${className || ""}`}
      onClick={() => onClick(game)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{game.title}</h4>
              <span className="font-mono text-muted-foreground text-xs">
                {game.id}
              </span>
            </div>
            <p className="text-muted-foreground text-sm">{game.theme}</p>
            {game.notes && (
              <p className="mt-1 text-muted-foreground text-xs italic">
                {game.notes}
              </p>
            )}
            <div className="mt-2 flex items-center gap-4 text-muted-foreground text-sm">
              {game.participantCount !== undefined && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {game.participantCount}
                </span>
              )}
              {game.expiresAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDistanceToNow(game.expiresAt, {
                    addSuffix: true,
                    locale: locale === "ja" ? ja : enUS,
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
