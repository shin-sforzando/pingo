"use client";

import { GripVertical, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
  /**
   * Error message to display
   */
  error?: string;
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
  error,
}: SubjectItemProps) {
  // Get translations
  const t = useTranslations();

  // Local state for input value to prevent re-renders during typing
  const [inputValue, setInputValue] = useState(subject);

  // Update local state when subject prop changes (e.g., from API)
  useEffect(() => {
    setInputValue(subject);
  }, [subject]);

  // Handle input change locally
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Update parent component when input loses focus
  const handleInputBlur = () => {
    if (inputValue !== subject) {
      onSubjectChange(inputValue, index);
    }
  };
  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border p-2 transition-all",
          isAdopted ? "border-primary bg-primary/10" : "border-muted bg-card",
          error ? "border-destructive" : "",
          isDragging && "opacity-50",
          className,
        )}
      >
        {/* Drag handle */}
        <button
          type="button"
          className="cursor-grab touch-none border-none bg-transparent p-1"
          {...dragHandleProps}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Subject input */}
        <div className="relative flex-1">
          {isAdopted && (
            <div className="-left-1 -top-1 absolute flex h-5 w-5 items-center justify-center rounded-full bg-primary font-bold text-[10px] text-primary-foreground">
              {index + 1}
            </div>
          )}
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className={cn(
              isAdopted && "pl-5",
              error ? "border-destructive" : "",
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

      {/* Error message */}
      {error && (
        <div className="rounded-md border border-destructive/10 bg-destructive/5 px-2 py-1 text-destructive text-xs">
          {error}
        </div>
      )}
    </div>
  );
}
