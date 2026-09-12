import {
  buildAuthCookieInstructions,
  buildClearOauthNonceCookieInstruction,
} from '../../../../lib/auth-cookies';
import { safeRedirect } from '../../../../lib/auth-redirect';
import * as strapiClient from '../../../../lib/auth-strapi-client';
import { redirectWithCookies } from '../../_shared';

const OAUTH_ERROR_REDIRECT = '/entrar?error=oauth_failed';
const NONCE_COOKIE_NAME = 'valhalla_oauth_nonce';

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie');
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const eqIndex = part.indexOf('=');
    if (eqIndex === -1) continue;
    const cookieName = part.slice(0, eqIndex).trim();
    if (cookieName === name) {
      return decodeURIComponent(part.slice(eqIndex + 1).trim());
    }
  }
  return undefined;
}

export async function GET(request: Request): Promise<Response> {
  const secure = process.env.AUTH_COOKIE_SECURE === 'true';
  const clearNonceCookie = buildClearOauthNonceCookieInstruction(secure);

  const nonceCookieValue = readCookie(request, NONCE_COOKIE_NAME);
  if (!nonceCookieValue) {
    // Absence of the nonce cookie at the callback is an error condition
    // (expired, cleared, or never set), not a crash — per spec.
    return redirectWithCookies(OAUTH_ERROR_REDIRECT, [clearNonceCookie]);
  }

  const [, encodedReturnTo] = nonceCookieValue.split(':');
  const returnTo = safeRedirect(
    encodedReturnTo ? decodeURIComponent(encodedReturnTo) : null,
    '/'
  );

  const url = new URL(request.url);
  const accessToken = url.searchParams.get('access_token');
  if (!accessToken) {
    return redirectWithCookies(OAUTH_ERROR_REDIRECT, [clearNonceCookie]);
  }

  const result = await strapiClient.googleCallback(accessToken);
  if (!result.ok) {
    return redirectWithCookies(OAUTH_ERROR_REDIRECT, [clearNonceCookie]);
  }

  const authCookies = buildAuthCookieInstructions(result.data.tokens, secure);
  return redirectWithCookies(returnTo, [...authCookies, clearNonceCookie]);
}
