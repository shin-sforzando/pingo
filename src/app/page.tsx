"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const t = useTranslations("HomePage");
  const { user } = useAuth();
  // State to toggle between login and register forms
  const [showLoginForm, setShowLoginForm] = useState(true);

  return (
    <div className="container mx-auto p-4">
      {!user ? (
        // Display login or register form for unauthenticated users
        <div className="mx-auto max-w-md rounded-lg border bg-card p-6 shadow-md">
          {showLoginForm ? (
            <LoginForm onRegisterClick={() => setShowLoginForm(false)} />
          ) : (
            <RegisterForm onLoginClick={() => setShowLoginForm(true)} />
          )}
        </div>
      ) : (
        // Display game options for authenticated users
        <div className="space-y-4 text-center">
          <div className="flex justify-center gap-4">
            <Link href="/join-game">
              <Button size="lg" className="min-w-[150px]">
                {t("joinGame")}
              </Button>
            </Link>
            <Link href="/create-game">
              <Button size="lg" className="min-w-[150px]">
                {t("createGame")}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* How to Play section (displayed for all users) */}
      <section className="mx-auto mt-8 max-w-2xl">
        <div className="rounded-lg border bg-card p-6 shadow-md">
          <h2 className="mb-4 font-bold text-xl">{t("howToPlay")}</h2>
          <div className="space-y-4">
            <p>{t("howToPlayDescription")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
