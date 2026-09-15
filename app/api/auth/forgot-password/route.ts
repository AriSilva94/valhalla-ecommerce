import { handleForgotPassword } from '../../../lib/auth-handlers';
import { parseJsonBody, isValidEmail } from '../../../lib/auth-validation';
import { AUTH_ERROR_CODES } from '../../../lib/auth-contracts';
import * as strapiClient from '../../../lib/auth-strapi-client';
import { getAllowedOrigin } from '../../../lib/auth-request';
import { getClientIp, isOriginAllowed, enforceRateLimit, jsonError, jsonNoStore } from '../_shared';

export async function POST(request: Request): Promise<Response> {
  if (!isOriginAllowed(request, getAllowedOrigin())) {
    return jsonError(AUTH_ERROR_CODES.INVALID_ORIGIN, 403);
  }

  const rateLimitKey = `forgot-password:${getClientIp(request)}`;
  const rateLimit = await enforceRateLimit(rateLimitKey, 5, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    return jsonError(AUTH_ERROR_CODES.RATE_LIMITED, 429, rateLimit.retryAfterSeconds);
  }

  const parsed = await parseJsonBody(request);
  if (!parsed.ok) {
    return jsonError(AUTH_ERROR_CODES.VALIDATION_ERROR, parsed.status);
  }

  const body = parsed.data as { email?: unknown };
  const email = typeof body.email === 'string' ? body.email : '';

  if (!isValidEmail(email)) {
    return jsonError(AUTH_ERROR_CODES.VALIDATION_ERROR, 400);
  }

  await handleForgotPassword(email, strapiClient);
  return jsonNoStore({ ok: true, data: null }, 200);
}
