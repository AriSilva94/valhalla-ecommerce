import { resolveSession } from '../../../lib/auth-session';
import { buildAuthCookieInstructions, buildClearAuthCookieInstructions } from '../../../lib/auth-cookies';
import { AUTH_ERROR_CODES } from '../../../lib/auth-contracts';
import { readAuthCookies, jsonWithCookies, jsonError, jsonNoStore } from '../_shared';

export async function GET(request: Request): Promise<Response> {
  const { accessToken, refreshToken } = readAuthCookies(request);
  const secure = process.env.AUTH_COOKIE_SECURE !== 'false';

  const result = await resolveSession(accessToken, refreshToken);
  if (!result.ok) {
    if (result.error === AUTH_ERROR_CODES.UNAUTHENTICATED) {
      const cookieInstructions = buildClearAuthCookieInstructions(secure);
      return jsonWithCookies({ ok: false, error: result.error }, result.status, cookieInstructions);
    }
    return jsonError(result.error, result.status);
  }

  if (result.data.refreshed && result.data.newTokens) {
    const cookieInstructions = buildAuthCookieInstructions(result.data.newTokens, secure);
    return jsonWithCookies({ ok: true, data: { user: result.data.user } }, 200, cookieInstructions);
  }

  return jsonNoStore({ ok: true, data: { user: result.data.user } }, 200);
}
