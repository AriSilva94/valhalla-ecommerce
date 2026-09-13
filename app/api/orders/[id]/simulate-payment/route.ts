import { readAuthCookies, jsonError, jsonNoStore, jsonWithCookies, getClientIp, isOriginAllowed, enforceRateLimit } from "../../../auth/_shared";
import { resolveSession } from "../../../../lib/auth-session";
import { buildAuthCookieInstructions } from "../../../../lib/auth-cookies";
import { getAllowedOrigin } from "../../../../lib/auth-request";
import * as checkoutClient from "../../../../lib/checkout-strapi-client";
import { CHECKOUT_ERROR_CODES } from "../../../../lib/checkout-contracts";

// Sandbox-only: replaces the manual "simulate payment" click in the Asaas
// dashboard. Strapi is the authoritative gate (it refuses unless its own
// Asaas config points at the sandbox API), so this route just forwards the
// call — nothing here needs to duplicate that check.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  if (!isOriginAllowed(request, getAllowedOrigin())) {
    return jsonError(CHECKOUT_ERROR_CODES.INVALID_ORIGIN, 403);
  }

  const rateLimitKey = `simulate-payment:${getClientIp(request)}`;
  const rateLimit = enforceRateLimit(rateLimitKey, 10, 5 * 60 * 1000);
  if (!rateLimit.allowed) return jsonError(CHECKOUT_ERROR_CODES.RATE_LIMITED, 429);

  const { accessToken, refreshToken } = readAuthCookies(request);
  const session = await resolveSession(accessToken, refreshToken);
  if (!session.ok) return jsonError(session.error, session.status);

  const secure = process.env.AUTH_COOKIE_SECURE !== "false";
  const tokenToUse =
    session.data.refreshed && session.data.newTokens ? session.data.newTokens.accessToken : accessToken!;

  const { id: reference } = await params;
  if (!/^[a-f0-9]{6,40}$/i.test(reference)) {
    if (session.data.refreshed && session.data.newTokens) {
      const cookieInstructions = buildAuthCookieInstructions(session.data.newTokens, secure);
      return jsonWithCookies({ ok: false, error: CHECKOUT_ERROR_CODES.NOT_FOUND }, 404, cookieInstructions);
    }
    return jsonError(CHECKOUT_ERROR_CODES.NOT_FOUND, 404);
  }

  const result = await checkoutClient.simulatePayment(tokenToUse, reference);

  if (session.data.refreshed && session.data.newTokens) {
    const cookieInstructions = buildAuthCookieInstructions(session.data.newTokens, secure);
    if (!result.ok) {
      return jsonWithCookies({ ok: false, error: result.error }, result.status, cookieInstructions);
    }
    return jsonWithCookies({ ok: true }, 200, cookieInstructions);
  }

  if (!result.ok) return jsonError(result.error, result.status);
  return jsonNoStore({ ok: true });
}
