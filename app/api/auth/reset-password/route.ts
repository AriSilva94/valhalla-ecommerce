import { handleResetPassword } from '../../../lib/auth-handlers';
import { parseJsonBody, isValidPassword } from '../../../lib/auth-validation';
import { AUTH_ERROR_CODES } from '../../../lib/auth-contracts';
import * as strapiClient from '../../../lib/auth-strapi-client';
import { getClientIp, isOriginAllowed, enforceRateLimit, jsonError } from '../_shared';

export async function POST(request: Request): Promise<Response> {
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  if (!isOriginAllowed(request, publicSiteUrl)) {
    return jsonError(AUTH_ERROR_CODES.INVALID_ORIGIN, 403);
  }

  const rateLimitKey = `reset-password:${getClientIp(request)}`;
  const rateLimit = enforceRateLimit(rateLimitKey, 10, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    return jsonError(AUTH_ERROR_CODES.RATE_LIMITED, 429);
  }

  const parsed = await parseJsonBody(request);
  if (!parsed.ok) {
    return jsonError(AUTH_ERROR_CODES.VALIDATION_ERROR, parsed.status);
  }

  const body = parsed.data as {
    code?: unknown;
    password?: unknown;
    passwordConfirmation?: unknown;
  };
  const code = typeof body.code === 'string' ? body.code : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const passwordConfirmation =
    typeof body.passwordConfirmation === 'string' ? body.passwordConfirmation : '';

  if (!code || !isValidPassword(password) || password !== passwordConfirmation) {
    return jsonError(AUTH_ERROR_CODES.VALIDATION_ERROR, 400);
  }

  const result = await handleResetPassword(code, password, passwordConfirmation, strapiClient);
  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return Response.json({ ok: true, data: null }, { status: 200 });
}
