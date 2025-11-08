"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { setUserConsent } from "@/lib/analytics";

/**
 * Cookie consent banner component
 *
 * Displays a banner at the bottom of the screen on first visit,
 * allowing users to accept or decline analytics tracking.
 *
 * GDPR/CCPA compliant:
 * - Opt-in approach (no tracking until consent given)
 * - Clear choice between accept/decline
 * - Link to privacy policy
 */
export function CookieConsentBanner() {
  const t = useTranslations();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const consentValue = localStorage.getItem("pingo_analytics_consent");

    // Show banner only if no decision has been made
    if (!consentValue) {
      // Small delay for better UX
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    setUserConsent(true);
    setIsVisible(false);
  };

  const handleDecline = () => {
    setUserConsent(false);
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
      style={{
        animation: "slideUp 0.3s ease-out",
      }}
    >
      <Card className="mx-auto max-w-4xl border-2 shadow-lg">
        <CardContent className="pb-4 pt-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="mb-2 text-lg font-semibold">
                {t("CookieConsent.title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("CookieConsent.message")}
              </p>
              <Link
                href="/terms"
                className="mt-2 inline-block text-sm text-primary hover:underline"
              >
                {t("CookieConsent.learnMore")}
              </Link>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={handleDecline}
            className="w-full sm:w-auto"
          >
            {t("CookieConsent.decline")}
          </Button>
          <Button onClick={handleAccept} className="w-full sm:w-auto">
            {t("CookieConsent.accept")}
          </Button>
        </CardFooter>
      </Card>
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
