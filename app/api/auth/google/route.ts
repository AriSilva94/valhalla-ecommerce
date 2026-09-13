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

  // The nonce must travel as a `?state=` query param, not a path segment:
  // Strapi's grant callback validator requires this override URL's
  // *pathname* to exactly equal the stored provider's configured callback
  // pathname (it deliberately skips checking the query string "to allow
  // passing different states") — a `/callback/<nonce>` path was rejected
  // outright with "Invalid callback URL provided" (pathname mismatch).
  // The query string is genuinely safe to vary, but grant's own callback
  // redirect later concatenates `${override}?${...}` onto this URL by
  // blind string-append rather than merging query strings, so `state`'s
  // final parsed value ends up as `<nonce>?id_token=...&access_token=...`
  // rather than the plain nonce. See the callback route's
  // extractNonceFromState() for how that's unpacked reliably.
  const frontendPublicUrl =
    (process.env.FRONTEND_PUBLIC_URL ?? '').trim().replace(/\/+$/, '') || getAllowedOrigin();
  const callbackUrl = `${frontendPublicUrl}/api/auth/google/callback?state=${encodeURIComponent(nonce)}`;

  const strapiRedirectUrl = `${strapiPublicUrl}/api/connect/google?callback=${encodeURIComponent(callbackUrl)}`;

  return redirectWithCookies(strapiRedirectUrl, [nonceCookie]);
}
