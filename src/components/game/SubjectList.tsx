import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DndContext,
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
import { SubjectItem } from "./SubjectItem";

export interface Subject {
  id: string;
  text: string;
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
      id: `subject-${Date.now()}`,
      text: "",
    });
    onSubjectsChange(newSubjects);
  };

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = subjects.findIndex((s) => s.id === active.id);
      const newIndex = subjects.findIndex((s) => s.id === over.id);

      const newSubjects = arrayMove(subjects, oldIndex, newIndex);
      onSubjectsChange(newSubjects);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <DndContext
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
        </DndContext>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleAddSubject}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add New Subject
      </Button>

      <div className="text-muted-foreground text-xs">
        <p>
          The first {maxAdopted} subjects will be used in the bingo board. Drag
          and drop to reorder.
        </p>
      </div>
    </div>
  );
}
