"use client";

import { useEffect, useState } from "react";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { getAnalyticsConfig } from "../lib/analytics-config";
import { COOKIE_CONSENT_EVENT, getCookieConsent, type CookieConsent } from "../lib/cookie-consent";

export default function Analytics() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    setConsent(getCookieConsent());

    function onConsentChanged(e: Event) {
      const detail = (e as CustomEvent<CookieConsent | null>).detail;
      setConsent(detail ?? null);
    }
    window.addEventListener(COOKIE_CONSENT_EVENT, onConsentChanged);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsentChanged);
  }, []);

  if (consent !== "accepted") return null;

  const config = getAnalyticsConfig();
  if (!config.enabled) return null;

  if (config.mode === "gtm") {
    return <GoogleTagManager gtmId={config.gtmId} />;
  }

  return <GoogleAnalytics gaId={config.gaMeasurementId} />;
}
