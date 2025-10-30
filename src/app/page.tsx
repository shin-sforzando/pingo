"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const t = useTranslations();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  // Handle successful login/registration
  const handleAuthSuccess = () => {
    console.log("ℹ️ XXX: ~ page.tsx ~ Authentication successful");
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
          // User is logged in - show game action buttons
          <div className="grid grid-cols-2 gap-6">
            <Button asChild size="lg" className="h-16 text-lg">
              <Link href="/game/create">{t("HomePage.createGame")}</Link>
            </Button>
            <Button asChild size="lg" className="h-16 text-lg">
              <Link href="/game/join">{t("HomePage.joinGame")}</Link>
            </Button>
          </div>
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
      <section className="mx-auto mt-12 max-w-4xl">
        <div className="rounded-lg border bg-card p-6 shadow-md">
          <h2 className="mb-2 font-bold text-2xl">{t("HomePage.howToPlay")}</h2>
          <p className="mb-8 text-muted-foreground">
            {t("HomePage.howToPlayDescription")}
          </p>

          <Accordion type="multiple" className="w-full">
            {/* Section 1: Login (Registration) */}
            <AccordionItem value="login" className="mb-6">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-col items-start gap-1 text-left">
                  <h3 className="font-bold text-primary text-xl">
                    {t("HomePage.loginSection.title")}
                  </h3>
                  <p className="text-muted-foreground text-sm font-normal">
                    {t("HomePage.loginSection.description")}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-6 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {t("HomePage.loginSection.step1.title")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-muted-foreground text-sm">
                        {t("HomePage.loginSection.step1.description")}
                      </p>
                      <div className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-lg border-4 border-gray-300 shadow-xl">
                        <Image
                          src={t("HomePage.loginSection.step1.image")}
                          alt={t("HomePage.loginSection.step1.title")}
                          fill
                          loading="lazy"
                          className="object-contain"
                          sizes="(max-width: 640px) 100vw, 384px"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {t("HomePage.loginSection.step2.title")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-muted-foreground text-sm">
                        {t("HomePage.loginSection.step2.description")}
                      </p>
                      <div className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-lg border-4 border-gray-300 shadow-xl">
                        <Image
                          src={t("HomePage.loginSection.step2.image")}
                          alt={t("HomePage.loginSection.step2.title")}
                          fill
                          loading="lazy"
                          className="object-contain"
                          sizes="(max-width: 640px) 100vw, 384px"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 2: Create Game */}
            <AccordionItem value="create" className="mb-6">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-col items-start gap-1 text-left">
                  <h3 className="font-bold text-primary text-xl">
                    {t("HomePage.createGameSection.title")}
                  </h3>
                  <p className="text-muted-foreground text-sm font-normal">
                    {t("HomePage.createGameSection.description")}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-6 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {t("HomePage.createGameSection.step1.title")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-muted-foreground text-sm">
                        {t("HomePage.createGameSection.step1.description")}
                      </p>
                      <div className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-lg border-4 border-gray-300 shadow-xl">
                        <Image
                          src={t("HomePage.createGameSection.step1.image")}
                          alt={t("HomePage.createGameSection.step1.title")}
                          fill
                          loading="lazy"
                          className="object-contain"
                          sizes="(max-width: 640px) 100vw, 384px"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {t("HomePage.createGameSection.step2.title")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-muted-foreground text-sm">
                        {t("HomePage.createGameSection.step2.description")}
                      </p>
                      <div className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-lg border-4 border-gray-300 shadow-xl">
                        <Image
                          src={t("HomePage.createGameSection.step2.image")}
                          alt={t("HomePage.createGameSection.step2.title")}
                          fill
                          loading="lazy"
                          className="object-contain"
                          sizes="(max-width: 640px) 100vw, 384px"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {t("HomePage.createGameSection.step3.title")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-muted-foreground text-sm">
                        {t("HomePage.createGameSection.step3.description")}
                      </p>
                      <div className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-lg border-4 border-gray-300 shadow-xl">
                        <Image
                          src={t("HomePage.createGameSection.step3.image")}
                          alt={t("HomePage.createGameSection.step3.title")}
                          fill
                          loading="lazy"
                          className="object-contain"
                          sizes="(max-width: 640px) 100vw, 384px"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 3: Play Game */}
            <AccordionItem value="play" className="mb-6">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-col items-start gap-1 text-left">
                  <h3 className="font-bold text-primary text-xl">
                    {t("HomePage.playGameSection.title")}
                  </h3>
                  <p className="text-muted-foreground text-sm font-normal">
                    {t("HomePage.playGameSection.description")}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-6 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {t("HomePage.playGameSection.step1.title")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-muted-foreground text-sm">
                        {t("HomePage.playGameSection.step1.description")}
                      </p>
                      <div className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-lg border-4 border-gray-300 shadow-xl">
                        <Image
                          src={t("HomePage.playGameSection.step1.image")}
                          alt={t("HomePage.playGameSection.step1.title")}
                          fill
                          loading="lazy"
                          className="object-contain"
                          sizes="(max-width: 640px) 100vw, 384px"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {t("HomePage.playGameSection.step2.title")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-muted-foreground text-sm">
                        {t("HomePage.playGameSection.step2.description")}
                      </p>
                      <div className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-lg border-4 border-gray-300 shadow-xl">
                        <Image
                          src={t("HomePage.playGameSection.step2.image")}
                          alt={t("HomePage.playGameSection.step2.title")}
                          fill
                          loading="lazy"
                          className="object-contain"
                          sizes="(max-width: 640px) 100vw, 384px"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {t("HomePage.playGameSection.step3.title")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-muted-foreground text-sm">
                        {t("HomePage.playGameSection.step3.description")}
                      </p>
                      <div className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-lg border-4 border-gray-300 shadow-xl">
                        <Image
                          src={t("HomePage.playGameSection.step3.image")}
                          alt={t("HomePage.playGameSection.step3.title")}
                          fill
                          loading="lazy"
                          className="object-contain"
                          sizes="(max-width: 640px) 100vw, 384px"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {t("HomePage.playGameSection.step4.title")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-muted-foreground text-sm">
                        {t("HomePage.playGameSection.step4.description")}
                      </p>
                      <div className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-lg border-4 border-gray-300 shadow-xl">
                        <Image
                          src={t("HomePage.playGameSection.step4.image")}
                          alt={t("HomePage.playGameSection.step4.title")}
                          fill
                          loading="lazy"
                          className="object-contain"
                          sizes="(max-width: 640px) 100vw, 384px"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </div>
  );
}
