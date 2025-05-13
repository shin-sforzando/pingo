"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

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
import type { GameCreationData } from "@/types/schema";
import { gameCreationSchema } from "@/types/schema";

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

  // Default values for the form
  const defaultValues = {
    title: "",
    theme: "",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    isPublic: false,
    isPhotoSharingEnabled: true,
    requiredBingoLines: 1,
    confidenceThreshold: 0.5,
    notes: "",
  } as const;

  // Initialize form with schema validation
  const form = useForm({
    resolver: zodResolver(gameCreationSchema),
    defaultValues,
    mode: "onBlur",
  });

  // Handle form submission
  async function onSubmit(values: GameCreationData) {
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

      // Navigate to the home page after creation
      router.push("/");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : String(err) || t("Game.errors.creationFailed");
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

              {/* Game theme input */}
              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Game.theme")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("Game.themePlaceholder")}
                        data-testid="theme-input"
                        maxLength={50}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("Game.themeDescription")}
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
                    <div
                      className="font-medium text-destructive text-sm"
                      role="alert"
                      aria-live="polite"
                    >
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
