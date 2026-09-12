import { handleRegister } from '../../../lib/auth-handlers';
import { buildAuthCookieInstructions } from '../../../lib/auth-cookies';
import { parseJsonBody, isValidEmail, isValidPassword } from '../../../lib/auth-validation';
import { AUTH_ERROR_CODES } from '../../../lib/auth-contracts';
import * as strapiClient from '../../../lib/auth-strapi-client';
import { getClientIp, isOriginAllowed, enforceRateLimit, jsonWithCookies, jsonError } from '../_shared';

export async function POST(request: Request): Promise<Response> {
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  if (!isOriginAllowed(request, publicSiteUrl)) {
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

  const secure = process.env.AUTH_COOKIE_SECURE === 'true';
  const cookieInstructions = buildAuthCookieInstructions(result.data.tokens, secure);
  return jsonWithCookies({ ok: true, data: { user: result.data.user } }, 200, cookieInstructions);
}
