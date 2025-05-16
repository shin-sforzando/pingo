"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useId } from "react";
import { SubjectItem } from "./SubjectItem";

export interface Subject {
  id: string;
  text: string;
  error?: string;
}

export interface SubjectListProps {
  /**
   * Array of subjects
   */
  subjects: Subject[];
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
  onSubjectsChange: (subjects: Subject[]) => void;
}

/**
 * SortableSubjectItem component
 *
 * Wrapper for SubjectItem that adds sortable functionality
 */
function SortableSubjectItem({
  subject,
  index,
  isAdopted,
  onSubjectChange,
  onDelete,
}: {
  subject: Subject;
  index: number;
  isAdopted: boolean;
  onSubjectChange: (value: string, index: number) => void;
  onDelete: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subject.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <SubjectItem
        subject={subject.text}
        isAdopted={isAdopted}
        index={index}
        onSubjectChange={onSubjectChange}
        onDelete={onDelete}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        error={subject.error}
      />
    </div>
  );
}

/**
 * SubjectList component
 *
 * Displays a list of subjects with drag and drop reordering.
 * Subjects can be added, edited, deleted, and reordered.
 */
export function SubjectList({
  subjects,
  maxAdopted = 24,
  className,
  onSubjectsChange,
}: SubjectListProps) {
  // Generate stable IDs for subjects
  const idPrefix = useId();

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Handle subject text change
  const handleSubjectChange = (value: string, index: number) => {
    const newSubjects = [...subjects];
    newSubjects[index] = { ...newSubjects[index], text: value };
    onSubjectsChange(newSubjects);
  };

  // Handle subject deletion
  const handleDelete = (index: number) => {
    const newSubjects = [...subjects];
    newSubjects.splice(index, 1);
    onSubjectsChange(newSubjects);
  };

  // Handle adding a new subject
  const handleAddSubject = () => {
    const newSubjects = [...subjects];
    newSubjects.push({
      id: `${idPrefix}-subject-${subjects.length}`,
      text: "",
    });
    onSubjectsChange(newSubjects);
  };

  // Get translations
  const t = useTranslations();

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = subjects.findIndex((s) => s.id === active.id);
      const newIndex = subjects.findIndex((s) => s.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        console.error(
          `Invalid drag and drop operation: oldIndex=${oldIndex}, newIndex=${newIndex}`,
        );
        return;
      }

      const newSubjects = arrayMove(subjects, oldIndex, newIndex);
      onSubjectsChange(newSubjects);
    }
  };

  // Dynamic import DndContextWrapper with SSR disabled
  const DndContextWrapper = dynamic(() => import("./DndContextWrapper"), {
    ssr: false,
  });

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <DndContextWrapper
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={subjects.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {subjects.map((subject, index) => (
              <SortableSubjectItem
                key={subject.id}
                subject={subject}
                index={index}
                isAdopted={index < maxAdopted}
                onSubjectChange={handleSubjectChange}
                onDelete={handleDelete}
              />
            ))}
          </SortableContext>
        </DndContextWrapper>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddSubject}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        {t("Game.addNewSubject")}
      </Button>

      <div className="text-muted-foreground text-xs">
        <p>{t("Game.subjectsUsageDescription", { 0: maxAdopted })}</p>
      </div>
    </div>
  );
}
