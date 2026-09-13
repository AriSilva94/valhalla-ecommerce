"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import {
  COOKIE_CONSENT_EVENT,
  getCookieConsent,
  setCookieConsent,
  type CookieConsent,
} from "../lib/cookie-consent";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getCookieConsent() === null);

    function onConsentChanged(e: Event) {
      const detail = (e as CustomEvent<CookieConsent | null>).detail;
      setVisible(detail === null);
    }
    window.addEventListener(COOKIE_CONSENT_EVENT, onConsentChanged);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsentChanged);
  }, []);

  if (!visible) return null;

  function choose(consent: CookieConsent) {
    setCookieConsent(consent);
    setVisible(false);
  }

  return (
    <div
      role="region"
      aria-label="Consentimento de cookies"
      className="fixed bottom-0 inset-x-0 z-90 bg-vh-card border-t border-t-vh-violet shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.55)]"
    >
      <div className="max-w-245 my-0 mx-auto py-4 px-6 flex flex-wrap items-center gap-4">
        <Cookie aria-hidden="true" size={22} strokeWidth={2} className="text-vh-lime shrink-0" />
        <p className="m-0 flex-1 min-w-60 font-medium text-vh-12-5/vh-165 font-manrope text-vh-soft">
          Usamos cookies essenciais para o funcionamento do site e, com sua
          permissão, cookies de análise para entender como você usa a
          Valhalla. Veja detalhes na nossa{" "}
          <Link href="/cookies" className="vh-lime underline underline-offset-2">
            Política de Cookies
          </Link>{" "}
          e{" "}
          <Link href="/politica-privacidade" className="vh-lime underline underline-offset-2">
            Política de Privacidade
          </Link>
          .
        </p>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => choose("rejected")}
            className="py-2.5 px-4 rounded-vh-10 border border-vh-border bg-transparent cursor-pointer text-white font-semibold text-vh-12-5 font-space-grotesk"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="py-2.5 px-4 rounded-vh-10 border-0 bg-vh-lime cursor-pointer text-vh-ink font-bold text-vh-12-5 font-space-grotesk"
          >
            Aceitar cookies
          </button>
        </div>
      </div>
    </div>
  );
}
