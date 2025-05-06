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

interface RegisterFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onLoginClick?: () => void;
}

export function RegisterForm({
  onSuccess,
  onCancel,
  onLoginClick,
}: RegisterFormProps) {
  const t = useTranslations("Auth");
  const { register, error, clearError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation schema
  const formSchema = z
    .object({
      handle: z
        .string()
        .min(3, {
          message: t("errors.handleTooShort"),
        })
        .max(20, {
          message: t("errors.handleTooLong"),
        }),
      password: z.string().min(8, {
        message: t("errors.passwordTooShort"),
      }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("errors.passwordMismatch"),
      path: ["confirmPassword"],
    });

  // Form hook
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      handle: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    clearError();
    setIsSubmitting(true);

    try {
      const success = await register(values.handle, values.password);
      if (success && onSuccess) {
        onSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 p-1">
      <h2 className="font-semibold text-lg">{t("register")}</h2>

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
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("confirmPassword")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t("confirmPasswordPlaceholder")}
                    autoComplete="new-password"
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
              {isSubmitting ? t("registering") : t("register")}
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

      {onLoginClick && (
        <div className="text-center text-sm">
          <span className="text-muted-foreground">
            {t("alreadyHaveAccount")}
          </span>{" "}
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={onLoginClick}
          >
            {t("login")}
          </button>
        </div>
      )}
    </div>
  );
}
