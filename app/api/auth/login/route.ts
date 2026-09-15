import { handleLogin } from '../../../lib/auth-handlers';
import { buildAuthCookieInstructions } from '../../../lib/auth-cookies';
import { parseJsonBody, isValidPassword } from '../../../lib/auth-validation';
import { AUTH_ERROR_CODES } from '../../../lib/auth-contracts';
import * as strapiClient from '../../../lib/auth-strapi-client';
import { getAllowedOrigin } from '../../../lib/auth-request';
import { getClientIp, isOriginAllowed, enforceRateLimit, jsonWithCookies, jsonError } from '../_shared';

export async function POST(request: Request): Promise<Response> {
  if (!isOriginAllowed(request, getAllowedOrigin())) {
    return jsonError(AUTH_ERROR_CODES.INVALID_ORIGIN, 403);
  }

  const rateLimitKey = `login:${getClientIp(request)}`;
  const rateLimit = await enforceRateLimit(rateLimitKey, 10, 5 * 60 * 1000);
  if (!rateLimit.allowed) {
    return jsonError(AUTH_ERROR_CODES.RATE_LIMITED, 429, rateLimit.retryAfterSeconds);
  }

  const parsed = await parseJsonBody(request);
  if (!parsed.ok) {
    return jsonError(AUTH_ERROR_CODES.VALIDATION_ERROR, parsed.status);
  }

  const body = parsed.data as { identifier?: unknown; password?: unknown };
  const identifier = typeof body.identifier === 'string' ? body.identifier : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!identifier || !isValidPassword(password)) {
    return jsonError(AUTH_ERROR_CODES.VALIDATION_ERROR, 400);
  }

  const result = await handleLogin(identifier, password, strapiClient);
  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  const secure = process.env.AUTH_COOKIE_SECURE !== 'false';
  const cookieInstructions = buildAuthCookieInstructions(result.data.tokens, secure);
  return jsonWithCookies({ ok: true, data: { user: result.data.user } }, 200, cookieInstructions);
}
