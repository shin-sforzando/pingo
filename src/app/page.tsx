"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const t = useTranslations();
  const { user, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  // Handle successful login/registration
  const handleAuthSuccess = () => {
    console.log("Authentication successful");
  };

  // Handle auth error
  const handleAuthError = (error: Error) => {
    console.error("Authentication error:", error);
  };

  return (
    <div className="container mx-auto p-4">
      {/* Authentication section */}
      <section className="mx-auto mt-8 max-w-md">
        {user ? (
          // User is logged in - show profile info and logout button
          <Card className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <h2 className="font-bold text-xl">{t("HomePage.welcome")}</h2>
              <p className="text-center">
                {t("Header.loggedInAs")} <strong>{user.username}</strong>
              </p>
              <Button
                onClick={() => logout()}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {t("Auth.logout")}
              </Button>
            </div>
          </Card>
        ) : (
          // User is not logged in - show login/register forms
          <Card className="p-6">
            <Tabs
              defaultValue="login"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t("Auth.login")}</TabsTrigger>
                <TabsTrigger value="register">{t("Auth.register")}</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-4">
                <LoginForm
                  onSuccess={handleAuthSuccess}
                  onError={handleAuthError}
                />
                <p className="mt-4 text-center text-muted-foreground text-sm">
                  {t("Auth.dontHaveAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("register")}
                    className="underline hover:text-primary"
                  >
                    {t("Auth.register")}
                  </button>
                </p>
              </TabsContent>
              <TabsContent value="register" className="mt-4">
                <RegisterForm
                  onSuccess={handleAuthSuccess}
                  onError={handleAuthError}
                />
                <p className="mt-4 text-center text-muted-foreground text-sm">
                  {t("Auth.alreadyHaveAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className="underline hover:text-primary"
                  >
                    {t("Auth.login")}
                  </button>
                </p>
              </TabsContent>
            </Tabs>
          </Card>
        )}
      </section>

      {/* How to Play section (displayed for all users) */}
      <section className="mx-auto mt-8 max-w-2xl">
        <div className="rounded-lg border bg-card p-6 shadow-md">
          <h2 className="mb-4 font-bold text-xl">{t("HomePage.howToPlay")}</h2>
          <div className="space-y-4">
            <p>{t("HomePage.howToPlayDescription")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
