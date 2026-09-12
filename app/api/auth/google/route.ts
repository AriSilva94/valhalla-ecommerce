import crypto from 'node:crypto';
import { buildOauthNonceCookieInstruction } from '../../../lib/auth-cookies';
import { safeRedirect } from '../../../lib/auth-redirect';
import { getAllowedOrigin } from '../../../lib/auth-request';
import { redirectWithCookies } from '../_shared';

// GET only — this route is a browser navigation (the user clicks "Entrar
// com Google"), not a fetch() call from a form, so there is no JSON body
// and no Origin-based CSRF check to perform here (a cross-site GET
// navigation cannot forge state, unlike a cross-site POST).
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const returnTo = safeRedirect(url.searchParams.get('returnTo'), '/');

  const nonce = crypto.randomBytes(16).toString('hex');
  const secure = process.env.AUTH_COOKIE_SECURE !== 'false';

  // The nonce cookie's value carries both the nonce (for CSRF/replay
  // protection at the callback) and the validated returnTo path, so the
  // callback can read it back without needing a second cookie or trusting
  // any value coming from Google/Strapi's redirect chain.
  const cookieValue = `${nonce}:${encodeURIComponent(returnTo)}`;
  const nonceCookie = buildOauthNonceCookieInstruction(cookieValue, secure);

  const strapiPublicUrl = (process.env.STRAPI_PUBLIC_URL ?? '').trim().replace(/\/+$/, '');
  if (!strapiPublicUrl) {
    return redirectWithCookies('/entrar?error=oauth_failed', []);
  }

  // Strapi's users-permissions provider validator does not check search
  // params on the callback URL it is handed, so a `state` query param
  // nested inside this `callback` override survives the full Google OAuth
  // round trip untouched — that's what lets the callback route verify it
  // against the nonce cookie set here (see app/api/auth/google/callback).
  const frontendPublicUrl =
    (process.env.FRONTEND_PUBLIC_URL ?? '').trim().replace(/\/+$/, '') || getAllowedOrigin();
  const callbackUrl = `${frontendPublicUrl}/api/auth/google/callback?state=${encodeURIComponent(nonce)}`;

  const strapiRedirectUrl = `${strapiPublicUrl}/api/connect/google?callback=${encodeURIComponent(callbackUrl)}`;

  return redirectWithCookies(strapiRedirectUrl, [nonceCookie]);
}
