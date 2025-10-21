"use client";

import {
  Calendar,
  Camera,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Target,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import { GameStatus } from "@/types/common";
import type { Game } from "@/types/schema";

export interface GameInfoProps {
  /**
   * Game data to display
   */
  game: Game;
  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * Component to display detailed game information
 * Shows status, settings, expiration, and other game details
 */
export function GameInfo({ game, className }: GameInfoProps) {
  const t = useTranslations();

  // Determine status badge variant and color
  const getStatusConfig = () => {
    switch (game.status) {
      case GameStatus.ACTIVE:
        return {
          variant: "default" as const,
          color: "bg-green-100 text-green-800",
          label: t("Game.active"),
        };
      case GameStatus.ENDED:
        return {
          variant: "secondary" as const,
          color: "bg-gray-100 text-gray-800",
          label: t("Game.ended"),
        };
      case GameStatus.ARCHIVED:
        return {
          variant: "outline" as const,
          color: "bg-orange-100 text-orange-800",
          label: t("Game.archived"),
        };
      default:
        return {
          variant: "secondary" as const,
          color: "bg-gray-100 text-gray-800",
          label: game.status,
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t("Game.status")}</span>
          <Badge variant={statusConfig.variant} className={statusConfig.color}>
            {statusConfig.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Expiration Date */}
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="font-medium text-sm">{t("Game.expirationDate")}</p>
            <p className="text-muted-foreground text-sm">
              {formatDate(game.expiresAt)}
            </p>
          </div>
        </div>

        <Separator />

        {/* Required Bingo Lines */}
        <div className="flex items-center gap-3">
          <Target className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="font-medium text-sm">
              {t("Game.requiredBingoLines")}
            </p>
            <p className="text-muted-foreground text-sm">
              {game.requiredBingoLines} {t("Game.lines")}
            </p>
          </div>
        </div>

        <Separator />

        {/* Confidence Threshold */}
        <div className="flex items-center gap-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="font-medium text-sm">
              {t("Game.confidenceThreshold")}
            </p>
            <p className="text-muted-foreground text-sm">
              {Math.round(game.confidenceThreshold * 100)}%
            </p>
          </div>
        </div>

        <Separator />

        {/* Public/Private Setting */}
        <div className="flex items-center gap-3">
          {game.isPublic ? (
            <Globe className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
          <div className="flex-1">
            <p className="font-medium text-sm">
              {game.isPublic ? t("Game.public") : t("Game.private")}
            </p>
          </div>
        </div>

        <Separator />

        {/* Photo Sharing Setting */}
        <div className="flex items-center gap-3">
          {game.isPhotoSharingEnabled ? (
            <Eye className="h-4 w-4 text-muted-foreground" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
          <div className="flex-1">
            <p className="font-medium text-sm">{t("Game.photoSharing")}</p>
            <p className="text-muted-foreground text-sm">
              {game.isPhotoSharingEnabled ? t("Game.on") : t("Game.off")}
            </p>
          </div>
        </div>

        {/* Notes (if present) */}
        {game.notes && (
          <>
            <Separator />
            <div className="flex items-start gap-3">
              <Camera className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="mb-2 font-medium text-sm">{t("Game.notes")}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {game.notes}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
