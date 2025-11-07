"use client";

import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";
import { useEffect, useState } from "react";
import { hasUserConsent } from "@/lib/analytics";

/**
 * Google Analytics integration component with consent management
 *
 * Only renders GA4 scripts when:
 * 1. NEXT_PUBLIC_GA_MEASUREMENT_ID is configured
 * 2. User has given explicit consent (GDPR/CCPA compliance)
 *
 * This prevents loading GA4 scripts until user consent is obtained.
 */
export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // Check consent status on mount and update state
    setHasConsent(hasUserConsent());

    // Listen for storage events to detect consent changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "pingo_analytics_consent") {
        setHasConsent(hasUserConsent());
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Don't render if GA ID is not configured
  if (!gaId) {
    return null;
  }

  // Don't render if user hasn't consented
  if (!hasConsent) {
    return null;
  }

  return <NextGoogleAnalytics gaId={gaId} />;
}
