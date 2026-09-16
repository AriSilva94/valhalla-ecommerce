export type CookieConsent = "accepted" | "rejected";

const STORAGE_KEY = "vh-cookie-consent";
export const COOKIE_CONSENT_EVENT = "vh-cookie-consent-changed";

export function subscribeCookieConsent(onChange: () => void): () => void {
  window.addEventListener(COOKIE_CONSENT_EVENT, onChange);
  return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onChange);
}

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    return null;
  }
}

export function setCookieConsent(consent: CookieConsent): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, consent);
  } catch {
    return;
  }
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: consent }));
}

export function clearCookieConsent(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: null }));
}
