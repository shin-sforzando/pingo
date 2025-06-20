import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { Game } from "@/types/schema";
import { useTranslations } from "next-intl";

interface GameHeaderProps {
  game: Game | null;
  className?: string;
}

/**
 * Game header displaying title and theme information
 * Provides visual context for the current game session
 */
export function GameHeader({ game, className }: GameHeaderProps) {
  const t = useTranslations("Game");

  if (!game) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-center font-bold text-2xl">
          {game.title}
        </CardTitle>
        {game.theme && (
          <p className="text-center text-muted-foreground text-sm">
            {t("theme")}: {game.theme}
          </p>
        )}
      </CardHeader>
    </Card>
  );
}
