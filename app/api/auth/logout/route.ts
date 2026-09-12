import { handleLogout } from '../../../lib/auth-handlers';
import { buildClearAuthCookieInstructions } from '../../../lib/auth-cookies';
import { AUTH_ERROR_CODES } from '../../../lib/auth-contracts';
import * as strapiClient from '../../../lib/auth-strapi-client';
import { isOriginAllowed, readAuthCookies, jsonWithCookies, jsonError } from '../_shared';

export async function POST(request: Request): Promise<Response> {
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  if (!isOriginAllowed(request, publicSiteUrl)) {
    return jsonError(AUTH_ERROR_CODES.INVALID_ORIGIN, 403);
  }

  const { accessToken } = readAuthCookies(request);
  const secure = process.env.AUTH_COOKIE_SECURE === 'true';

  // Always clear cookies, regardless of whether the upstream revoke
  // succeeded — handleLogout already swallows Strapi failures into a
  // neutral success, but we clear cookies unconditionally either way.
  if (accessToken) {
    await handleLogout(accessToken, strapiClient);
  }

  const cookieInstructions = buildClearAuthCookieInstructions(secure);
  return jsonWithCookies({ ok: true, data: null }, 200, cookieInstructions);
}
