export type AnalyticsMode = "gtm" | "ga" | "off";

type AnalyticsEnv = Record<string, string | undefined>;

export type AnalyticsConfig =
  | {
      enabled: true;
      mode: "gtm";
      gtmId: string;
    }
  | {
      enabled: true;
      mode: "ga";
      gaMeasurementId: string;
    }
  | {
      enabled: false;
      mode: "off";
    };

function normalizeMode(value: string | undefined): AnalyticsMode {
  if (value === "gtm" || value === "ga" || value === "off") return value;
  return "off";
}

function hasValidGtmId(value: string | undefined): value is string {
  return Boolean(value?.trim().match(/^GTM-[A-Z0-9-]+$/i));
}

function hasValidGaMeasurementId(value: string | undefined): value is string {
  return Boolean(value?.trim().match(/^G-[A-Z0-9]+$/i));
}

export function getAnalyticsConfig(env: AnalyticsEnv = process.env): AnalyticsConfig {
  const analyticsEnabled = env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true";
  const mode = normalizeMode(env.NEXT_PUBLIC_ANALYTICS_MODE);

  if (!analyticsEnabled || mode === "off") {
    return { enabled: false, mode: "off" };
  }

  if (mode === "gtm" && hasValidGtmId(env.NEXT_PUBLIC_GTM_ID)) {
    return {
      enabled: true,
      mode: "gtm",
      gtmId: env.NEXT_PUBLIC_GTM_ID.trim(),
    };
  }

  if (mode === "ga" && hasValidGaMeasurementId(env.NEXT_PUBLIC_GA_MEASUREMENT_ID)) {
    return {
      enabled: true,
      mode: "ga",
      gaMeasurementId: env.NEXT_PUBLIC_GA_MEASUREMENT_ID.trim(),
    };
  }

  return { enabled: false, mode: "off" };
}
