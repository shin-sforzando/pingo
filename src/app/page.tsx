"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";
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
        <div className="max-w-md mx-auto bg-card p-6 rounded-lg shadow-md border">
          {showLoginForm ? (
            <LoginForm onRegisterClick={() => setShowLoginForm(false)} />
          ) : (
            <RegisterForm onLoginClick={() => setShowLoginForm(true)} />
          )}
        </div>
      ) : (
        // Display game options for authenticated users
        <div className="text-center space-y-4">
          <div className="flex justify-center gap-4">
            <Button size="lg" className="min-w-[150px]">
              {t("joinGame")}
            </Button>
            <Button size="lg" className="min-w-[150px]">
              {t("createGame")}
            </Button>
          </div>
        </div>
      )}

      {/* How to Play section (displayed for all users) */}
      <section className="mt-8 max-w-2xl mx-auto">
        <div className="bg-card p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-bold mb-4">{t("howToPlay")}</h2>
          <div className="space-y-4">
            <p>{t("howToPlayDescription")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
