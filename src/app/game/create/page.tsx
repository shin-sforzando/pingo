"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { type Resolver, type SubmitHandler, useForm } from "react-hook-form";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { BingoBoard } from "@/components/game/BingoBoard";
import { type Subject, SubjectList } from "@/components/game/SubjectList";
import { ShineBorder } from "@/components/magicui/shine-border";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TranslatedFormMessage } from "@/components/ui/translated-form-message";
import { useAuth } from "@/contexts/AuthContext";
import { trackGameCreated } from "@/lib/analytics";
import {
  BOARD_CENTER_COORD,
  BOARD_SIZE,
  CENTER_CELL_INDEX,
  NON_FREE_CELLS,
} from "@/lib/constants";
import { auth } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";
import type { Cell, GameCreationData } from "@/types/schema";
import { gameCreationSchema } from "@/types/schema";

// Use the existing gameCreationSchema
type GameCreateFormValues = GameCreationData;

/**
 * Game creation page component
 */
export default function CreateGamePage() {
  const { refreshUser } = useAuth();
  const t = useTranslations();
  const idPrefix = useId();

  // State for subjects
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isGeneratingSubjects, setIsGeneratingSubjects] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // State for cells (bingo board)
  const [cells, setCells] = useState<Cell[]>([]);

  // State for skipping subjects check (UI-only, not persisted)
  const [skipSubjectsCheck, setSkipSubjectsCheck] = useState(false);

  // Calculate default expiration date (1 day from now)
  const defaultExpiresAt = new Date();
  defaultExpiresAt.setDate(defaultExpiresAt.getDate() + 1);

  // Form setup with type assertion to resolve compatibility issues
  const form = useForm<GameCreateFormValues>({
    resolver: zodResolver(gameCreationSchema) as Resolver<GameCreateFormValues>,
    mode: "onBlur", // Validate on blur
    defaultValues: {
      title: "",
      theme: "",
      expiresAt: defaultExpiresAt,
      isPublic: false,
      isPhotoSharingEnabled: true,
      skipImageCheck: false,
      isShuffleEnabled: false,
      requiredBingoLines: 1,
      confidenceThreshold: 0.5,
      maxSubmissionsPerUser: 30,
      notes: "",
    },
  });

  // Watch title and theme values for button enabling/disabling
  const title = form.watch("title");
  const theme = form.watch("theme");

  /**
   * Generate subjects using AI based on title and theme
   */
  const generateSubjects = async () => {
    console.log("ℹ️ XXX: ~ page.tsx ~ generateSubjects called");
    const { title, theme } = form.getValues();

    // Validate title and theme
    if (!title || !theme) {
      setGenerationError(t("Game.errors.titleAndThemeRequired"));
      return;
    }

    setIsGeneratingSubjects(true);
    setGenerationError(null);

    try {
      console.log("ℹ️ XXX: ~ page.tsx ~ Calling /api/subjects/generate");
      const response = await fetch("/api/subjects/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          theme,
          numberOfCandidates: 30, // Request more than needed to have extras
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("Game.errors.generationFailed"));
      }

      const data = await response.json();
      console.log("ℹ️ XXX: ~ page.tsx ~ Generate API response:", data);

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.candidates || !Array.isArray(data.candidates)) {
        throw new Error(t("Game.errors.generationFailed"));
      }

      // First, remove duplicates within the candidates array using Set
      const uniqueCandidates = [...new Set(data.candidates as string[])];

      // Then filter out candidates that already exist in subjects
      const existingTexts = subjects.map((subject) => subject.text);
      const uniqueNewCandidates = uniqueCandidates.filter(
        (text) => !existingTexts.includes(text),
      );

      console.log(
        `ℹ️ XXX: ~ page.tsx ~ Filtered ${data.candidates.length - uniqueNewCandidates.length} duplicates`,
      );

      // Create subject objects for the new unique candidates
      const newSubjectObjects: Subject[] = uniqueNewCandidates.map(
        (text: string, index: number) => ({
          id: `${idPrefix}-subject-${Date.now()}-${index}`,
          text,
        }),
      );

      // Append new subjects to existing ones
      const updatedSubjects = [...subjects, ...newSubjectObjects];
      setSubjects(updatedSubjects);

      // Update cells for the bingo board
      updateCells(updatedSubjects);
    } catch (error) {
      console.error("Error generating subjects:", error);
      setGenerationError(
        error instanceof Error
          ? error.message
          : t("Game.errors.generationFailed"),
      );
    } finally {
      setIsGeneratingSubjects(false);
    }
  };

  /**
   * Update cells for the bingo board based on subjects
   */
  const updateCells = (subjectList: Subject[]) => {
    // Take the first NON_FREE_CELLS subjects (or fewer if not enough)
    const boardSubjects = subjectList.slice(0, NON_FREE_CELLS);

    // Create cells array
    const newCells: Cell[] = [];

    // Add cells in row-major order
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        const index = y * BOARD_SIZE + x;
        const isCenterCell =
          x === BOARD_CENTER_COORD && y === BOARD_CENTER_COORD;

        // Center cell is always FREE
        if (isCenterCell) {
          newCells.push({
            id: `cell_${index}`,
            position: { x, y },
            subject: "FREE",
            isFree: true,
          });
          continue;
        }

        // Calculate the subject index (accounting for the FREE cell)
        const subjectIndex = index < CENTER_CELL_INDEX ? index : index - 1;

        // Add the cell with the subject (if available)
        if (subjectIndex < boardSubjects.length) {
          newCells.push({
            id: `cell_${index}`,
            position: { x, y },
            subject: boardSubjects[subjectIndex].text,
            isFree: false,
          });
        } else {
          // Empty cell if not enough subjects
          newCells.push({
            id: `cell_${index}`,
            position: { x, y },
            subject: "",
            isFree: false,
          });
        }
      }
    }

    setCells(newCells);
  };

  /**
   * Handle subjects change from SubjectList component
   */
  const handleSubjectsChange = (newSubjects: Subject[]) => {
    setSubjects(newSubjects);
    updateCells(newSubjects);
  };

  // State for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  /**
   * Handle form submission
   */
  const onSubmit: SubmitHandler<GameCreateFormValues> = async (data) => {
    console.log("ℹ️ XXX: ~ page.tsx ~ onSubmit called");
    // Validate that we have enough subjects
    if (subjects.length < NON_FREE_CELLS) {
      setSubmissionError(t("Game.errors.notEnoughValidSubjects"));
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      // Extract subject texts from the first NON_FREE_CELLS subjects (those used in the bingo board)
      const boardSubjects = subjects.slice(0, NON_FREE_CELLS);
      const boardSubjectTexts = boardSubjects.map((subject) => subject.text);

      // Skip subjects check if requested (for development/testing only)
      if (!skipSubjectsCheck) {
        // Validate only the subjects that will be used in the bingo board
        console.log(
          `ℹ️ XXX: ~ page.tsx ~ /api/subjects/check for the first ${NON_FREE_CELLS} subjects`,
        );
        const checkResponse = await fetch("/api/subjects/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subjects: boardSubjectTexts,
          }),
        });

        const checkData = await checkResponse.json();
        console.log("ℹ️ XXX: ~ page.tsx ~ Check API response:", checkData);

        if (!checkResponse.ok) {
          throw new Error(checkData.error || t("Game.errors.validationFailed"));
        }

        if (checkData.ok === false && checkData.issues) {
          // Mark subjects with issues (only for the first NON_FREE_CELLS subjects)
          const updatedSubjects = subjects.map((subject, index) => {
            // Only check the first NON_FREE_CELLS subjects
            if (index < NON_FREE_CELLS) {
              const issue = checkData.issues.find(
                (issue: { subject: string; reason: string }) =>
                  issue.subject === subject.text,
              );

              if (issue) {
                return { ...subject, error: issue.reason };
              }

              // Clear any previous errors for valid subjects
              return { ...subject, error: undefined };
            }

            // Keep subjects beyond the first NON_FREE_CELLS unchanged
            return subject;
          });

          // Count valid subjects (without errors)
          const validSubjectsCount = updatedSubjects.filter(
            (subject) => !subject.error,
          ).length;

          if (validSubjectsCount < NON_FREE_CELLS) {
            setSubmissionError(t("Game.errors.notEnoughValidSubjects"));

            // Update subjects with error messages
            setSubjects(updatedSubjects);
            updateCells(updatedSubjects);

            return;
          }

          // Show warning about subjects with issues
          setSubmissionError(t("Game.someSubjectsFiltered"));

          // Update subjects with error messages
          setSubjects(updatedSubjects);
          return;
        }
      }

      // Prepare cells data from subjects
      const cellsData = cells.map((cell) => ({
        position: cell.position,
        subject: cell.subject,
        isFree: cell.isFree,
      }));

      // Prepare request data
      const requestData = {
        ...data,
        cells: cellsData,
      };

      // Send request to API
      console.log("ℹ️ XXX: ~ page.tsx ~ Calling /api/game/create");

      // Get the ID token from Firebase Authentication
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/game/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || t("Game.errors.creationFailed"),
        );
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(
          responseData.error?.message || t("Game.errors.creationFailed"),
        );
      }

      // Refresh user data to update participatingGames array
      // Why: Game creation automatically adds the creator as a participant,
      // but AuthContext cache is not automatically invalidated
      try {
        await refreshUser();
      } catch (refreshErr) {
        // Log but don't fail the creation operation if refresh fails
        console.error(
          "Failed to refresh user after game creation:",
          refreshErr,
        );
      }

      // Track game creation event
      trackGameCreated(responseData.data.gameId, BOARD_SIZE);

      // Redirect to game share page
      window.location.href = `/game/${responseData.data.gameId}/share`;
    } catch (error) {
      console.error("Error creating game:", error);
      setSubmissionError(
        error instanceof Error
          ? error.message
          : t("Game.errors.creationFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="container mx-auto space-y-8 py-6">
        <h1 className="font-bold text-3xl">{t("Game.createNew")}</h1>
        <p className="text-muted-foreground">{t("Game.createDescription")}</p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Game.details")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Game.title")}</FormLabel>
                      <FormDescription>
                        {t("Game.titleDescription")}
                      </FormDescription>
                      <FormControl>
                        <Input
                          placeholder={t("Game.titlePlaceholder")}
                          {...field}
                        />
                      </FormControl>
                      <TranslatedFormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Game.theme")}</FormLabel>
                      <FormDescription>
                        {t("Game.themeDescription")}
                      </FormDescription>
                      <FormControl>
                        <Input
                          placeholder={t("Game.themePlaceholder")}
                          {...field}
                        />
                      </FormControl>
                      <TranslatedFormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <div className="relative">
                    <Button
                      type="button"
                      onClick={generateSubjects}
                      disabled={isGeneratingSubjects || !title || !theme}
                      className="w-full"
                    >
                      {isGeneratingSubjects
                        ? t("Game.generatingSubjects")
                        : t("Game.generateSubjectsWithAI")}
                    </Button>
                    {isGeneratingSubjects && (
                      <ShineBorder borderWidth={2} duration={3} />
                    )}
                  </div>
                  {isGeneratingSubjects && (
                    <div className="animate-pulse text-center text-muted-foreground text-sm">
                      {t("Game.generatingSubjectsDescription")}
                    </div>
                  )}
                  {generationError && (
                    <p className="text-destructive text-sm">
                      {generationError}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Subjects List */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Game.subjects")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground text-sm">
                      {0 < subjects.length
                        ? t("Game.subjectsCount", { count: subjects.length })
                        : t("Game.noSubjects")}
                    </div>
                    {0 < subjects.length && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSubjects([]);
                          setCells([]);
                        }}
                      >
                        {t("Game.resetSubjects")}
                      </Button>
                    )}
                  </div>
                  <SubjectList
                    subjects={subjects}
                    onSubjectsChange={handleSubjectsChange}
                    maxAdopted={24}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Board Preview */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Game.boardPreview")}</CardTitle>
                <p className="mt-4 text-muted-foreground text-xs">
                  {t("Game.boardDescription", { 0: NON_FREE_CELLS })}
                </p>
              </CardHeader>
              <CardContent>
                <div className="mx-auto max-w-md">
                  <BingoBoard cells={cells} />
                </div>
              </CardContent>
            </Card>

            {/* Game Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Game.settings")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Expiration Date Setting */}
                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("Game.expiresAt")}</FormLabel>
                      <FormDescription>
                        {t("Game.expiresAtDescription")}
                      </FormDescription>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>{t("Game.selectDate")}</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <TranslatedFormMessage />
                    </FormItem>
                  )}
                />
                {/* Public/Private Setting */}
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>{t("Game.isPublic")}</FormLabel>
                        <FormDescription>
                          {t("Game.isPublicDescription")}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Photo Sharing Setting */}
                <FormField
                  control={form.control}
                  name="isPhotoSharingEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>{t("Game.isPhotoSharingEnabled")}</FormLabel>
                        <FormDescription>
                          {t("Game.isPhotoSharingEnabledDescription")}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Skip Subjects Check Setting (UI-only) */}
                <div className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t("Game.skipSubjectsCheck")}</FormLabel>
                    <FormDescription>
                      {t("Game.skipSubjectsCheckDescription")}
                    </FormDescription>
                  </div>
                  <Switch
                    checked={skipSubjectsCheck}
                    onCheckedChange={setSkipSubjectsCheck}
                  />
                </div>

                {/* Skip Image Check Setting (saved to database) */}
                <FormField
                  control={form.control}
                  name="skipImageCheck"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>{t("Game.skipImageCheck")}</FormLabel>
                        <FormDescription>
                          {t("Game.skipImageCheckDescription")}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Shuffle Board Setting (saved to database) */}
                <FormField
                  control={form.control}
                  name="isShuffleEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>{t("Game.isShuffleEnabled")}</FormLabel>
                        <FormDescription>
                          {t("Game.isShuffleEnabledDescription")}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Required Bingo Lines Setting */}
                <FormField
                  control={form.control}
                  name="requiredBingoLines"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Game.requiredBingoLines")}</FormLabel>
                      <FormDescription>
                        {t("Game.requiredBingoLinesDescription")}
                      </FormDescription>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min={1}
                            max={5}
                            {...field}
                            onChange={(e) => {
                              const value = Number.parseInt(e.target.value, 10);
                              if (1 <= value && value <= 5) {
                                field.onChange(value);
                              }
                            }}
                            className="w-20"
                          />
                          <span className="text-muted-foreground">(1-5)</span>
                        </div>
                      </FormControl>
                      <TranslatedFormMessage />
                    </FormItem>
                  )}
                />

                {/* Confidence Threshold Setting */}
                <FormField
                  control={form.control}
                  name="confidenceThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Game.confidenceThreshold")}</FormLabel>
                      <FormDescription>
                        {t("Game.confidenceThresholdDescription")}
                      </FormDescription>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min={0}
                            max={1}
                            step={0.1}
                            {...field}
                            onChange={(e) => {
                              const value = Number.parseFloat(e.target.value);
                              if (0 <= value && value <= 1) {
                                field.onChange(value);
                              }
                            }}
                            className="w-20"
                          />
                          <span className="text-muted-foreground">
                            (0.0-1.0)
                          </span>
                        </div>
                      </FormControl>
                      <TranslatedFormMessage />
                    </FormItem>
                  )}
                />

                {/* Max Submissions Per User Setting */}
                <FormField
                  control={form.control}
                  name="maxSubmissionsPerUser"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Game.maxSubmissionsPerUser")}</FormLabel>
                      <FormDescription>
                        {t("Game.maxSubmissionsPerUserDescription")}
                      </FormDescription>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            {...field}
                            onChange={(e) => {
                              const value = Number.parseInt(e.target.value, 10);
                              if (1 <= value && value <= 100) {
                                field.onChange(value);
                              }
                            }}
                            className="w-20"
                          />
                          <span className="text-muted-foreground">(1-100)</span>
                        </div>
                      </FormControl>
                      <TranslatedFormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Game.notes")}</FormLabel>
                      <FormDescription>
                        {t("Game.notesDescription")}
                      </FormDescription>
                      <FormControl>
                        <Textarea
                          placeholder={t("Game.notesPlaceholder")}
                          {...field}
                        />
                      </FormControl>
                      <TranslatedFormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={
                isSubmitting ||
                !title ||
                !theme ||
                subjects.length < NON_FREE_CELLS
              }
            >
              {isSubmitting ? t("Game.creating") : t("Game.create")}
            </Button>

            {submissionError && (
              <p className="mt-2 text-destructive text-sm">{submissionError}</p>
            )}
          </form>
        </Form>
      </div>
    </AuthGuard>
  );
}
