"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { GameCreationPreview } from "@/components/game/GameCreationPreview";
import type { Subject } from "@/components/game/SubjectList";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TranslatedFormMessage } from "@/components/ui/translated-form-message";

// Define a simplified schema for game creation
const gameCreationSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Game.errors.titleRequired" })
    .max(50, { message: "Game.errors.titleTooLong" }),
});

// Type for the form data
type GameCreationFormData = z.infer<typeof gameCreationSchema>;

/**
 * New Game Creation Page
 *
 * Allows users to create a new bingo game by:
 * 1. Setting a game title
 * 2. Adding and editing subjects
 * 3. Previewing the bingo board
 */
export default function NewGamePage() {
  const t = useTranslations();
  const router = useRouter();

  // State for subjects (managed separately from the form)
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // State for loading
  const [isCreating, setIsCreating] = useState(false);

  // State for error
  const [error, setError] = useState<string | null>(null);

  // Initialize form with schema validation
  const form = useForm<GameCreationFormData>({
    resolver: zodResolver(gameCreationSchema),
    defaultValues: {
      title: "",
    },
    mode: "onBlur",
  });

  // Handle form submission
  async function onSubmit(values: GameCreationFormData) {
    if (subjects.length < 1) {
      setError("Game.errors.subjectsRequired");
      return;
    }

    setError(null);

    try {
      setIsCreating(true);

      // TODO: Implement actual game creation logic with Firebase
      // For now, we'll just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Creating game with:", {
        ...values,
        subjects: subjects.map((s) => s.text),
      });

      // Navigate to the games list page after creation
      router.push("/game");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : String(err) || "Game.errors.creationFailed";
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="container space-y-8 py-8">
      <h1 className="font-bold text-3xl">{t("Game.createNew")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("Game.details")}</CardTitle>
          <CardDescription>{t("Game.createDescription")}</CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-8">
              {/* Game title input */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Game.title")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("Game.titlePlaceholder")}
                        data-testid="title-input"
                        maxLength={50}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("Game.titleDescription")}
                    </FormDescription>
                    <TranslatedFormMessage />
                  </FormItem>
                )}
              />

              {/* Game creation preview */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm">{t("Game.subjects")}</h3>
                <GameCreationPreview
                  initialSubjects={subjects}
                  onSubjectsChange={setSubjects}
                />
                {subjects.length < 1 &&
                  error === "Game.errors.subjectsRequired" && (
                    <div className="font-medium text-destructive text-sm">
                      {t("Game.errors.subjectsRequired")}
                    </div>
                  )}
              </div>
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isCreating}
              >
                {t("Common.cancel")}
              </Button>

              <Button
                type="submit"
                disabled={
                  isCreating || !form.formState.isValid || subjects.length < 1
                }
                data-testid="submit-button"
              >
                {isCreating ? t("Game.creating") : t("Game.create")}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
