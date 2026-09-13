import { timingSafeEqual } from 'node:crypto';
import {
  buildAuthCookieInstructions,
  buildClearOauthNonceCookieInstruction,
} from '../../../../../lib/auth-cookies';
import { safeRedirect } from '../../../../../lib/auth-redirect';
import * as strapiClient from '../../../../../lib/auth-strapi-client';
import { redirectWithCookies } from '../../../_shared';

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

// Constant-time string comparison, mirroring the backend's
// src/policies/internal-test-token.ts pattern: a length mismatch is
// checked and short-circuited before calling timingSafeEqual (it requires
// equal-length buffers), which is safe — a length mismatch only reveals
// the length of the guess, not any information about matching content.
function constantTimeEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
}

// Why the nonce lives in the PATH, not a `?state=` query param: Strapi's
// grant-based OAuth "connect" flow builds its final redirect as
// `${callback}?${qs.stringify(providerData)}` — a blind concatenation, not
// a merge. If `callback` already carries its own `?state=<nonce>`, grant
// appends a SECOND `?`, producing
// `.../callback?state=<nonce>?id_token=...&access_token=...`. A URL only
// has one query-string delimiter, so everything after the first `?` —
// including that second `?id_token=...` — becomes part of the `state`
// value itself. `state` then never equals the plain nonce, and every
// login fails with oauth_failed regardless of the Google account used.
// Verified directly: production logs showed the callback route receiving
// `state=<nonce>?id_token=...&access_token=...&raw[...]=...` as one
// mangled query value.
// A path segment has no such delimiter collision — grant's `?`-appended
// querystring lands cleanly after it every time.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ nonce: string }> }
): Promise<Response> {
  const { nonce: nonceFromPath } = await params;
  const secure = process.env.AUTH_COOKIE_SECURE !== 'false';
  const clearNonceCookie = buildClearOauthNonceCookieInstruction(secure);

  const nonceCookieValue = readCookie(request, NONCE_COOKIE_NAME);
  if (!nonceCookieValue) {
    // Absence of the nonce cookie at the callback is an error condition
    // (expired, cleared, or never set), not a crash — per spec.
    return redirectWithCookies(OAUTH_ERROR_REDIRECT, [clearNonceCookie]);
  }

  const [expectedNonce, encodedReturnTo] = nonceCookieValue.split(':');

  // This is the actual CSRF/replay check — merely requiring the cookie to
  // exist (the old behavior) never verified anything about the incoming
  // request.
  if (
    !expectedNonce ||
    !nonceFromPath ||
    !constantTimeEquals(nonceFromPath, expectedNonce)
  ) {
    return redirectWithCookies(OAUTH_ERROR_REDIRECT, [clearNonceCookie]);
  }

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
