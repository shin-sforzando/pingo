"use client";

import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AcceptanceStatus } from "@/types/common";

export interface SubmissionResultProps {
  /**
   * AI confidence score (0-1)
   */
  confidence: number;
  /**
   * AI analysis critique in Japanese
   */
  critique_ja: string;
  /**
   * AI analysis critique in English
   */
  critique_en: string;
  /**
   * Final acceptance status
   */
  acceptanceStatus: AcceptanceStatus;
  /**
   * Subject of matched cell (if any)
   */
  matchedCellSubject?: string | null;
  /**
   * Game confidence threshold
   */
  confidenceThreshold: number;
  /**
   * Image URL to display
   */
  imageUrl?: string;
  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * Component to display AI image analysis results
 * Shows confidence, critique, acceptance status, and matched cell info
 */
export function SubmissionResult({
  confidence,
  critique_ja,
  critique_en,
  acceptanceStatus,
  matchedCellSubject,
  confidenceThreshold,
  imageUrl,
  className,
}: SubmissionResultProps) {
  const t = useTranslations();
  const locale = useLocale();

  // Select critique based on current locale
  const critique = locale === "ja" ? critique_ja : critique_en;

  // Determine status icon and color based on acceptance status
  const getStatusConfig = () => {
    switch (acceptanceStatus) {
      case "accepted":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          badgeVariant: "default" as const,
          badgeColor: "bg-green-100 text-green-800",
        };
      case "no_match":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          badgeVariant: "destructive" as const,
          badgeColor: "bg-red-100 text-red-800",
        };
      case "inappropriate_content":
        return {
          icon: AlertTriangle,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          badgeVariant: "secondary" as const,
          badgeColor: "bg-orange-100 text-orange-800",
        };
      default:
        return {
          icon: AlertTriangle,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          badgeVariant: "secondary" as const,
          badgeColor: "bg-gray-100 text-gray-800",
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  // Format confidence as percentage
  const confidencePercentage = Math.round(confidence * 100);
  const thresholdPercentage = Math.round(confidenceThreshold * 100);

  return (
    <Card
      className={cn(
        "transition-colors",
        statusConfig.bgColor,
        statusConfig.borderColor,
        className,
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <StatusIcon className={cn("h-5 w-5", statusConfig.color)} />
          {t("Game.SubmissionResult.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Image Preview */}
        {imageUrl && (
          <div className="flex justify-center">
            {/* biome-ignore lint/performance/noImgElement: External URLs require <img> for browser test compatibility */}
            <img
              src={imageUrl}
              alt="Submitted content for analysis"
              className="h-24 w-24 rounded-lg object-cover shadow-sm"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        {/* Matched Cell Info (if accepted) */}
        {acceptanceStatus === "accepted" && matchedCellSubject && (
          <div className="rounded-md bg-green-100 p-3">
            <p className="font-medium text-green-800 text-sm">
              {t("Game.SubmissionResult.matchedCell")}: {matchedCellSubject}
            </p>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <Badge
            variant={statusConfig.badgeVariant}
            className={statusConfig.badgeColor}
          >
            {t(`Game.SubmissionResult.status.${acceptanceStatus}`)}
          </Badge>
          <span className="text-muted-foreground text-sm">
            {t("Game.SubmissionResult.confidence", {
              confidence: confidencePercentage,
              threshold: thresholdPercentage,
            })}
          </span>
        </div>

        {/* AI Critique */}
        <div>
          <p className="mb-2 font-medium text-sm">
            {t("Game.SubmissionResult.analysis")}
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {critique}
          </p>
        </div>

        {/* Confidence Bar */}
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span>{t("Game.SubmissionResult.confidenceLabel")}</span>
            <span>{confidencePercentage}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className={cn(
                "h-2 rounded-full transition-all",
                confidenceThreshold <= confidence
                  ? "bg-green-500"
                  : "bg-red-500",
              )}
              style={{ width: `${confidencePercentage}%` }}
            />
          </div>
          <div className="mt-1 text-muted-foreground text-xs">
            {t("Game.SubmissionResult.thresholdNote", {
              threshold: thresholdPercentage,
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
