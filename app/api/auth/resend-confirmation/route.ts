import { handleResendConfirmation } from '../../../lib/auth-handlers';
import { parseJsonBody, isValidEmail } from '../../../lib/auth-validation';
import { AUTH_ERROR_CODES } from '../../../lib/auth-contracts';
import * as strapiClient from '../../../lib/auth-strapi-client';
import { getClientIp, isOriginAllowed, enforceRateLimit, jsonError } from '../_shared';

export async function POST(request: Request): Promise<Response> {
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  if (!isOriginAllowed(request, publicSiteUrl)) {
    return jsonError(AUTH_ERROR_CODES.INVALID_ORIGIN, 403);
  }

  const rateLimitKey = `resend-confirmation:${getClientIp(request)}`;
  const rateLimit = enforceRateLimit(rateLimitKey, 5, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    return jsonError(AUTH_ERROR_CODES.RATE_LIMITED, 429);
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

  // Neutral response on every code path once validation passes — no
  // branching on the handler's result (no email enumeration).
  await handleResendConfirmation(email, strapiClient);
  return Response.json({ ok: true, data: null }, { status: 200 });
}
