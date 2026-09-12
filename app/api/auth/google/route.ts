import crypto from 'node:crypto';
import { buildOauthNonceCookieInstruction } from '../../../lib/auth-cookies';
import { safeRedirect } from '../../../lib/auth-redirect';
import { redirectWithCookies } from '../_shared';

// GET only — this route is a browser navigation (the user clicks "Entrar
// com Google"), not a fetch() call from a form, so there is no JSON body
// and no Origin-based CSRF check to perform here (a cross-site GET
// navigation cannot forge state, unlike a cross-site POST).
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const returnTo = safeRedirect(url.searchParams.get('returnTo'), '/');

  const nonce = crypto.randomBytes(16).toString('hex');
  const secure = process.env.AUTH_COOKIE_SECURE === 'true';

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

  return redirectWithCookies(`${strapiPublicUrl}/api/connect/google`, [nonceCookie]);
}
