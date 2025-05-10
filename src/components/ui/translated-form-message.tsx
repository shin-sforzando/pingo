"use client";

import { useFormField } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function TranslatedFormMessage({
  className,
  ...props
}: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField();
  const t = useTranslations();

  // If there's an error, translate the message
  const errorMessage = error?.message ? t(error.message as string) : null;
  const body = errorMessage ?? props.children;

  if (!body) {
    return null;
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-destructive text-sm", className)}
      {...props}
    >
      {body}
    </p>
  );
}
