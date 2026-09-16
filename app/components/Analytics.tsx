"use client";

import { useSyncExternalStore } from "react";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { getAnalyticsConfig } from "../lib/analytics-config";
import { getCookieConsent, subscribeCookieConsent } from "../lib/cookie-consent";

export default function Analytics() {
  const consent = useSyncExternalStore(subscribeCookieConsent, getCookieConsent, () => null);

  if (consent !== "accepted") return null;

  const config = getAnalyticsConfig();
  if (!config.enabled) return null;

  if (config.mode === "gtm") {
    return <GoogleTagManager gtmId={config.gtmId} />;
  }

  return <GoogleAnalytics gaId={config.gaMeasurementId} />;
}
