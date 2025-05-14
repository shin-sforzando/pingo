"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { GripVertical, X } from "lucide-react";
import { useTranslations } from "next-intl";

export interface SubjectItemProps {
  /**
   * Subject text
   */
  subject: string;
  /**
   * Whether this subject is adopted (will be used in the bingo board)
   */
  isAdopted: boolean;
  /**
   * Index of this subject in the list
   */
  index: number;
  /**
   * Optional CSS class name
   */
  className?: string;
  /**
   * Handler for subject text change
   */
  onSubjectChange: (value: string, index: number) => void;
  /**
   * Handler for subject deletion
   */
  onDelete: (index: number) => void;
  /**
   * Whether the item is being dragged
   */
  isDragging?: boolean;
  /**
   * Reference for drag handle
   */
  dragHandleProps?: Record<string, unknown>;
}

/**
 * SubjectItem component
 *
 * Represents a single subject item in the subject list.
 * Can be adopted (will be used in the bingo board) or not.
 */
export function SubjectItem({
  subject,
  isAdopted,
  index,
  className,
  onSubjectChange,
  onDelete,
  isDragging = false,
  dragHandleProps,
}: SubjectItemProps) {
  // Get translations
  const t = useTranslations();
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border p-2 transition-all",
        isAdopted ? "border-primary bg-primary/10" : "border-muted bg-card",
        isDragging && "opacity-50",
        className,
      )}
    >
      {/* Drag handle */}
      <div
        className="cursor-grab touch-none"
        {...dragHandleProps}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Subject input */}
      <div className="relative flex-1">
        {isAdopted && (
          <div className="-left-1 -top-1 absolute flex h-5 w-5 items-center justify-center rounded-full bg-primary font-bold text-[10px] text-primary-foreground">
            {index + 1}
          </div>
        )}
        <Input
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value, index)}
          className={cn(
            isAdopted && "pl-5",
            "focus-visible:ring-1 focus-visible:ring-primary",
          )}
          maxLength={30}
          placeholder={t("Game.subjectPlaceholder")}
        />
      </div>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(index)}
        aria-label="Delete subject"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
