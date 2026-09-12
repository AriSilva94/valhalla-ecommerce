import { handleLogout } from '../../../lib/auth-handlers';
import {
  buildClearAuthCookieInstructions,
  buildClearOauthNonceCookieInstruction,
} from '../../../lib/auth-cookies';
import { AUTH_ERROR_CODES } from '../../../lib/auth-contracts';
import { getSiteUrl } from '../../../lib/site-url';
import * as strapiClient from '../../../lib/auth-strapi-client';
import { isOriginAllowed, readAuthCookies, jsonWithCookies, jsonError } from '../_shared';

export async function POST(request: Request): Promise<Response> {
  if (!isOriginAllowed(request, getSiteUrl())) {
    return jsonError(AUTH_ERROR_CODES.INVALID_ORIGIN, 403);
  }

  const { accessToken } = readAuthCookies(request);
  const secure = process.env.AUTH_COOKIE_SECURE !== 'false';

  // Always clear cookies, regardless of whether the upstream revoke
  // succeeded — handleLogout already swallows Strapi failures into a
  // neutral success, but we clear cookies unconditionally either way.
  if (accessToken) {
    await handleLogout(accessToken, strapiClient);
  }

  const cookieInstructions = [
    ...buildClearAuthCookieInstructions(secure),
    buildClearOauthNonceCookieInstruction(secure),
  ];
  return jsonWithCookies({ ok: true, data: null }, 200, cookieInstructions);
}
