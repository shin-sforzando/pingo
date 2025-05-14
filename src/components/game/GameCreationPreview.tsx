"use client";

import { cn } from "@/lib/utils";
import type { Cell } from "@/types/schema";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { BingoBoard } from "./BingoBoard";
import type { Subject } from "./SubjectList";
import { SubjectList } from "./SubjectList";

export interface GameCreationPreviewProps {
  /**
   * Initial subjects
   */
  initialSubjects?: Subject[];
  /**
   * Maximum number of subjects to adopt (use in the bingo board)
   */
  maxAdopted?: number;
  /**
   * Optional CSS class name
   */
  className?: string;
  /**
   * Handler for subjects change
   */
  onSubjectsChange?: (subjects: Subject[]) => void;
}

/**
 * GameCreationPreview component
 *
 * Combines SubjectList and BingoBoard for game creation.
 * Changes to the subject list are reflected in the bingo board preview in real-time.
 */
export function GameCreationPreview({
  initialSubjects = [],
  maxAdopted = 24,
  className,
  onSubjectsChange,
}: GameCreationPreviewProps) {
  // Generate stable IDs for subjects
  const idPrefix = useId();

  // Initialize with empty subjects to fill up to maxAdopted
  const generateInitialSubjects = () => {
    // Use provided initialSubjects
    const subjects = [...initialSubjects];

    // Fill remaining slots with empty subjects
    const remainingCount = maxAdopted - subjects.length;
    if (0 < remainingCount) {
      const emptySubjects = Array.from({ length: remainingCount }, (_, i) => ({
        id: `${idPrefix}-empty-subject-${i}`,
        text: "",
      }));
      subjects.push(...emptySubjects);
    }

    return subjects;
  };

  // State for subjects
  const [subjects, setSubjects] = useState<Subject[]>(
    generateInitialSubjects(),
  );

  // Convert subjects to cells for the bingo board
  const subjectsToCells = (subjects: Subject[]): Cell[] => {
    const cells: Cell[] = [];
    const adoptedSubjects = subjects.slice(0, maxAdopted);

    // Create a 5x5 grid with empty cells
    const grid: (Cell | null)[][] = Array(5)
      .fill(null)
      .map(() => Array(5).fill(null));

    // Add the FREE cell in the center
    grid[2][2] = {
      id: "free-cell",
      position: { x: 2, y: 2 },
      subject: "FREE",
      isFree: true,
    };

    // Fill the grid with subjects (skipping the center)
    let subjectIndex = 0;
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        // Skip the center cell
        if (x === 2 && y === 2) continue;

        // If we have a subject for this position
        if (subjectIndex < adoptedSubjects.length) {
          const subject = adoptedSubjects[subjectIndex];
          grid[y][x] = {
            id: subject.id,
            position: { x, y },
            subject: subject.text,
            isFree: false,
          };
          subjectIndex++;
        } else {
          // Fill with empty cell
          grid[y][x] = {
            id: `empty-${x}-${y}`,
            position: { x, y },
            subject: "",
            isFree: false,
          };
        }
      }
    }

    // Flatten the grid to a 1D array
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const cell = grid[y][x];
        if (cell) {
          cells.push(cell);
        }
      }
    }

    return cells;
  };

  // Handle subjects change
  const handleSubjectsChange = (newSubjects: Subject[]) => {
    setSubjects(newSubjects);
    onSubjectsChange?.(newSubjects);
  };

  // Get translations
  const t = useTranslations();

  // Convert subjects to cells
  const cells = subjectsToCells(subjects);

  return (
    <div className={cn("space-y-8", className)}>
      {/* Subject list */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">
          {t("Game.editBingoCells", { 0: subjects.length, 1: maxAdopted })}
        </h3>
        <SubjectList
          subjects={subjects}
          maxAdopted={maxAdopted}
          onSubjectsChange={handleSubjectsChange}
        />
      </div>

      {/* Board preview */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">{t("Game.boardPreview")}</h3>
        <div className="mx-auto max-w-md">
          <BingoBoard cells={cells} />
        </div>
        <p className="text-center text-muted-foreground text-xs">
          {t("Game.boardDescription", { 0: maxAdopted })}
        </p>
      </div>
    </div>
  );
}
