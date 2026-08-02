import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { getAnalyticsConfig } from "../lib/analytics-config";

export default function Analytics() {
  const config = getAnalyticsConfig();

  if (!config.enabled) return null;

  if (config.mode === "gtm") {
    return <GoogleTagManager gtmId={config.gtmId} />;
  }

  return <GoogleAnalytics gaId={config.gaMeasurementId} />;
}
