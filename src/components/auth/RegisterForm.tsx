"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/contexts/AuthContext";
import type { UserCreationData } from "@/types/schema";
import { userCreationSchema } from "@/types/schema";

// Extended schema with password confirmation
const confirmPasswordSchema = z.object({
  confirmPassword: z
    .string()
    .min(1, { message: "Auth.errors.passwordRequired" }),
});

const extendedUserCreationSchema = userCreationSchema
  .merge(confirmPasswordSchema)
  .refine((data) => data.password === data.confirmPassword, {
    message: "Auth.errors.passwordMismatch",
    path: ["confirmPassword"],
  });

// Extended type with password confirmation
type ExtendedUserCreationData = UserCreationData &
  z.infer<typeof confirmPasswordSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function RegisterForm({ onSuccess, onError }: RegisterFormProps) {
  const t = useTranslations();
  const { register: registerUser, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // Initialize form with schema validation
  const form = useForm<ExtendedUserCreationData>({
    resolver: zodResolver(extendedUserCreationSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      isTestUser: false,
    },
    mode: "onBlur",
  });

  // Handle form submission
  async function onSubmit(values: ExtendedUserCreationData) {
    // Extract only the fields needed for registration
    const { username, password, isTestUser } = values;
    setError(null);

    try {
      await registerUser(username, password, isTestUser);
      onSuccess?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : String(err) || t("Auth.errors.registrationFailed");
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Auth.username")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("Auth.usernamePlaceholder")}
                  data-testid="username-input"
                  {...field}
                />
              </FormControl>
              <FormDescription>{t("Auth.usernameDescription")}</FormDescription>
              <TranslatedFormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Auth.password")}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={t("Auth.passwordPlaceholder")}
                  data-testid="password-input"
                  {...field}
                />
              </FormControl>
              <FormDescription>{t("Auth.passwordDescription")}</FormDescription>
              <TranslatedFormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Auth.confirmPassword")}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={t("Auth.confirmPasswordPlaceholder")}
                  data-testid="confirm-password-input"
                  {...field}
                />
              </FormControl>
              <TranslatedFormMessage />
            </FormItem>
          )}
        />

        {error && (
          <div className="font-medium text-destructive text-sm">{t(error)}</div>
        )}

        <div className="text-muted-foreground text-sm">
          {t.rich("Auth.termsOfServiceNotice", {
            terms: (chunks) => (
              <a
                href="/terms"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-primary"
              >
                {chunks}
              </a>
            ),
          })}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
          data-testid="submit-button"
        >
          {loading ? t("Auth.registering") : t("Auth.register")}
        </Button>
      </form>
    </Form>
  );
}
