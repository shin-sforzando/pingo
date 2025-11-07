import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";

/**
 * Google Analytics integration component
 * Only renders when NEXT_PUBLIC_GA_MEASUREMENT_ID is set
 */
export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  // Don't render if GA ID is not configured
  if (!gaId) {
    return null;
  }

  return <NextGoogleAnalytics gaId={gaId} />;
}
