import crypto from 'node:crypto';
import { buildOauthNonceCookieInstruction } from '../../../lib/auth-cookies';
import { safeRedirect } from '../../../lib/auth-redirect';
import { redirectWithCookies } from '../_shared';

function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get('host') ?? url.host;
  const proto = request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '');
  return `${proto}://${host}`;
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const returnTo = safeRedirect(url.searchParams.get('returnTo'), '/');

  const nonce = crypto.randomBytes(16).toString('hex');
  const secure = process.env.AUTH_COOKIE_SECURE !== 'false';

  const cookieValue = `${nonce}:${encodeURIComponent(returnTo)}`;
  const nonceCookie = buildOauthNonceCookieInstruction(cookieValue, secure);

  const strapiPublicUrl = (process.env.STRAPI_PUBLIC_URL ?? '').trim().replace(/\/+$/, '');
  if (!strapiPublicUrl) {
    return redirectWithCookies('/entrar?error=oauth_failed', []);
  }

  const callbackUrl = `${requestOrigin(request)}/api/auth/google/callback?state=${encodeURIComponent(nonce)}`;

  const strapiRedirectUrl = `${strapiPublicUrl}/api/connect/google?callback=${encodeURIComponent(callbackUrl)}`;

  return redirectWithCookies(strapiRedirectUrl, [nonceCookie]);
}
