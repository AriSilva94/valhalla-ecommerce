"use client";

import { clearCookieConsent } from "../lib/cookie-consent";

export default function CookiePreferencesButton() {
  return (
    <button
      type="button"
      onClick={() => clearCookieConsent()}
      className="py-2.5 px-4 rounded-vh-10 border-0 bg-vh-lime cursor-pointer text-vh-ink font-bold text-vh-12-5 font-space-grotesk"
    >
      Alterar preferências de cookies
    </button>
  );
}
