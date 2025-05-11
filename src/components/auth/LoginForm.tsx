"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TranslatedFormMessage } from "@/components/ui/translated-form-message";
import { useAuth } from "@/contexts/AuthContext";
import type { UserLoginData } from "@/types/schema";
import { userLoginSchema } from "@/types/schema";

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const t = useTranslations();
  const { login, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // Initialize form
  const form = useForm<UserLoginData>({
    resolver: zodResolver(userLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onBlur",
  });

  // Handle form submission
  async function onSubmit(values: UserLoginData) {
    setError(null);

    try {
      await login(values.username, values.password);
      onSuccess?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : String(err) || t("Auth.errors.loginFailed");
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
              <TranslatedFormMessage />
            </FormItem>
          )}
        />

        {error && (
          <div className="font-medium text-destructive text-sm">{t(error)}</div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
          data-testid="submit-button"
        >
          {loading ? t("Auth.loggingIn") : t("Auth.login")}
        </Button>
      </form>
    </Form>
  );
}
