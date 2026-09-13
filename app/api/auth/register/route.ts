import { handleRegister } from '../../../lib/auth-handlers';
import { buildAuthCookieInstructions } from '../../../lib/auth-cookies';
import { parseJsonBody, isValidEmail, isValidPassword } from '../../../lib/auth-validation';
import { AUTH_ERROR_CODES } from '../../../lib/auth-contracts';
import * as strapiClient from '../../../lib/auth-strapi-client';
import { getAllowedOrigin } from '../../../lib/auth-request';
import { getClientIp, isOriginAllowed, enforceRateLimit, jsonWithCookies, jsonError, jsonNoStore } from '../_shared';

export async function POST(request: Request): Promise<Response> {
  if (!isOriginAllowed(request, getAllowedOrigin())) {
    return jsonError(AUTH_ERROR_CODES.INVALID_ORIGIN, 403);
  }

  const rateLimitKey = `register:${getClientIp(request)}`;
  const rateLimit = enforceRateLimit(rateLimitKey, 5, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    return jsonError(AUTH_ERROR_CODES.RATE_LIMITED, 429);
  }

  const parsed = await parseJsonBody(request);
  if (!parsed.ok) {
    return jsonError(AUTH_ERROR_CODES.VALIDATION_ERROR, parsed.status);
  }

  const body = parsed.data as { username?: unknown; email?: unknown; password?: unknown };
  const username = typeof body.username === 'string' ? body.username : '';
  const email = typeof body.email === 'string' ? body.email : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!username || !isValidEmail(email) || !isValidPassword(password)) {
    return jsonError(AUTH_ERROR_CODES.VALIDATION_ERROR, 400);
  }

  const result = await handleRegister(username, email, password, strapiClient);
  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  if (!result.data.tokens.accessToken || !result.data.tokens.refreshToken) {
    return jsonNoStore({ ok: true, data: { user: result.data.user } }, 200);
  }

  const secure = process.env.AUTH_COOKIE_SECURE !== 'false';
  const cookieInstructions = buildAuthCookieInstructions(result.data.tokens, secure);
  return jsonWithCookies({ ok: true, data: { user: result.data.user } }, 200, cookieInstructions);
}
