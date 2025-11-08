"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { setUserConsent } from "@/lib/analytics";

/**
 * Cookie consent banner component
 *
 * Displays a drawer at the bottom of the screen on first visit,
 * allowing users to accept or decline analytics tracking.
 *
 * GDPR/CCPA compliant:
 * - Opt-in approach (no tracking until consent given)
 * - Clear choice between accept/decline
 * - Link to privacy policy
 *
 * Uses Drawer component for consistent UI patterns and accessibility
 */
export function CookieConsentBanner() {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const consentValue = localStorage.getItem("pingo_analytics_consent");

    // Show drawer only if no decision has been made
    if (!consentValue) {
      // Small delay for better UX
      setTimeout(() => setIsOpen(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    setUserConsent(true);
    setIsOpen(false);
  };

  const handleDecline = () => {
    setUserConsent(false);
    setIsOpen(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen} direction="bottom">
      <DrawerContent>
        <div className="mx-auto w-full max-w-4xl">
          <DrawerHeader>
            <DrawerTitle className="text-lg">
              {t("CookieConsent.title")}
            </DrawerTitle>
            <DrawerDescription className="text-sm">
              {t("CookieConsent.message")}
            </DrawerDescription>
            <Link
              href="/terms"
              className="mt-2 inline-block text-sm text-primary hover:underline"
            >
              {t("CookieConsent.learnMore")}
            </Link>
          </DrawerHeader>

          <DrawerFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
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
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
