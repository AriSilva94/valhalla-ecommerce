"use client";

import { Settings2 } from "lucide-react";
import { clearCookieConsent } from "../lib/cookie-consent";

export default function CookiePreferencesButton() {
  return (
    <button
      type="button"
      onClick={() => clearCookieConsent()}
      className="self-start inline-flex items-center gap-2 mt-1 py-2.5 px-4 rounded-vh-10 border-0 bg-vh-lime cursor-pointer text-vh-ink font-bold text-vh-12-5 font-space-grotesk [transition:filter_.12s] hover:brightness-110"
    >
      <Settings2 aria-hidden="true" size={14} strokeWidth={2.2} />
      Alterar preferências de cookies
    </button>
  );
}
