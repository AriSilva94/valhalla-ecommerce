import { timingSafeEqual } from 'node:crypto';
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

// Why `state` must be a PATH-FREE query param, and why its value is split
// on the first "?" before comparison — both are working around the same
// real, verified behavior of Strapi's grant-based OAuth flow:
//
// 1. At `/api/connect/google?callback=<override>`, grant's own callback
//    validator requires `new URL(override).pathname` to exactly equal the
//    stored provider's configured callback pathname (it explicitly does
//    NOT check the query string — "to allow passing different states").
//    So the override's pathname must stay exactly
//    `/api/auth/google/callback`; a nonce can only travel in the query
//    string here, e.g. `?state=<nonce>`. (A path segment like
//    `/callback/<nonce>` was tried and rejected by Strapi with
//    "ValidationError: Invalid callback URL provided" — pathname mismatch.)
// 2. At the actual callback (after Google), grant builds its redirect as
//    `${override}?${qs.stringify(providerOutput)}` — blind string
//    concatenation, not a query-string merge. Since our override already
//    has its own `?state=<nonce>`, this appends a SECOND `?`, so the full
//    incoming URL here is
//    `...&state=<nonce>?id_token=...&access_token=...&raw[...]=...`.
//    A URL has one query delimiter, so `state`'s parsed value is the
//    entire `<nonce>?id_token=...` blob up to the next real `&`, not just
//    the nonce.
// Our nonce is always a fixed-format hex string with no `?`/`=`/`&`
// characters, so splitting `state`'s raw value on the first literal "?"
// reliably recovers exactly the nonce we generated, regardless of what
// grant concatenates after it. `access_token` is unaffected — it's its
// own separate `&`-delimited pair, not nested inside `state`'s value.
function extractNonceFromState(rawState: string | null): string | null {
  if (!rawState) return null;
  return rawState.split('?')[0] || null;
}

export async function GET(request: Request): Promise<Response> {
  const secure = process.env.AUTH_COOKIE_SECURE !== 'false';
  const clearNonceCookie = buildClearOauthNonceCookieInstruction(secure);

  const nonceCookieValue = readCookie(request, NONCE_COOKIE_NAME);
  if (!nonceCookieValue) {
    // Absence of the nonce cookie at the callback is an error condition
    // (expired, cleared, or never set), not a crash — per spec.
    return redirectWithCookies(OAUTH_ERROR_REDIRECT, [clearNonceCookie]);
  }

  const [expectedNonce, encodedReturnTo] = nonceCookieValue.split(':');

  const url = new URL(request.url);
  const stateFromCallback = extractNonceFromState(url.searchParams.get('state'));

  // This is the actual CSRF/replay check — merely requiring the cookie to
  // exist (the old behavior) never verified anything about the incoming
  // request.
  if (
    !expectedNonce ||
    !stateFromCallback ||
    !constantTimeEquals(stateFromCallback, expectedNonce)
  ) {
    return redirectWithCookies(OAUTH_ERROR_REDIRECT, [clearNonceCookie]);
  }

  const returnTo = safeRedirect(
    encodedReturnTo ? decodeURIComponent(encodedReturnTo) : null,
    '/'
  );

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
