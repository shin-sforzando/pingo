import { cn } from "@/lib/utils";

interface ErrorDisplayProps {
  error: string | null;
  className?: string;
}

/**
 * Inline error display component for non-disruptive error messaging
 * Provides consistent error styling across the game page
 */
export function ErrorDisplay({ error, className }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <div
      className={cn(
        "rounded-md border border-destructive/20 bg-destructive/10 p-3 text-destructive text-sm",
        className,
      )}
    >
      {error}
    </div>
  );
}
