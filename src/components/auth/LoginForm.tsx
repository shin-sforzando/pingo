"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface LoginFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onRegisterClick?: () => void;
}

export function LoginForm({
  onSuccess,
  onCancel,
  onRegisterClick,
}: LoginFormProps) {
  const t = useTranslations("Auth");
  const { login, error, clearError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation schema
  const formSchema = z.object({
    handle: z.string().min(1, {
      message: t("errors.handleRequired"),
    }),
    password: z.string().min(1, {
      message: t("errors.passwordRequired"),
    }),
  });

  // Form hook
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      handle: "",
      password: "",
    },
  });

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    clearError();
    setIsSubmitting(true);

    try {
      const success = await login(values.handle, values.password);
      if (success && onSuccess) {
        onSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 p-1">
      <h2 className="font-semibold text-lg">{t("login")}</h2>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FormField
            control={form.control}
            name="handle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("handle")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("handlePlaceholder")}
                    autoComplete="username"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("password")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t("passwordPlaceholder")}
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <div className="font-medium text-destructive text-sm">{error}</div>
          )}

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("loggingIn") : t("login")}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                {t("cancel")}
              </Button>
            )}
          </div>
        </form>
      </Form>

      {onRegisterClick && (
        <div className="text-center text-sm">
          <span className="text-muted-foreground">{t("dontHaveAccount")}</span>{" "}
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={onRegisterClick}
          >
            {t("register")}
          </button>
        </div>
      )}
    </div>
  );
}
