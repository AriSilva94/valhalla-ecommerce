"use client";

import { sendGAEvent, sendGTMEvent } from "@next/third-parties/google";
import { getAnalyticsConfig } from "./analytics-config";

export type AnalyticsEventParameters = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(eventName: string, parameters: AnalyticsEventParameters = {}): void {
  const cleanEventName = eventName.trim();
  const config = getAnalyticsConfig();

  if (!cleanEventName || !config.enabled) return;

  if (config.mode === "gtm") {
    sendGTMEvent({ event: cleanEventName, ...parameters });
    return;
  }

  sendGAEvent("event", cleanEventName, parameters);
}
