import { readAuthCookies, jsonError, jsonNoStore, jsonWithCookies } from "../../auth/_shared";
import { resolveSession } from "../../../lib/auth-session";
import { buildAuthCookieInstructions } from "../../../lib/auth-cookies";
import * as checkoutClient from "../../../lib/checkout-strapi-client";
import { CHECKOUT_ERROR_CODES } from "../../../lib/checkout-contracts";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { accessToken, refreshToken } = readAuthCookies(request);
  const session = await resolveSession(accessToken, refreshToken);
  if (!session.ok) return jsonError(session.error, session.status);

  const secure = process.env.AUTH_COOKIE_SECURE !== "false";
  const tokenToUse =
    session.data.refreshed && session.data.newTokens ? session.data.newTokens.accessToken : accessToken!;

  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    if (session.data.refreshed && session.data.newTokens) {
      const cookieInstructions = buildAuthCookieInstructions(session.data.newTokens, secure);
      return jsonWithCookies({ ok: false, error: CHECKOUT_ERROR_CODES.NOT_FOUND }, 404, cookieInstructions);
    }
    return jsonError(CHECKOUT_ERROR_CODES.NOT_FOUND, 404);
  }

  const result = await checkoutClient.getOrder(tokenToUse, orderId);

  if (session.data.refreshed && session.data.newTokens) {
    const cookieInstructions = buildAuthCookieInstructions(session.data.newTokens, secure);
    if (!result.ok) {
      return jsonWithCookies({ ok: false, error: result.error }, result.status, cookieInstructions);
    }
    return jsonWithCookies({ ok: true, data: result.data }, 200, cookieInstructions);
  }

  if (!result.ok) return jsonError(result.error, result.status);
  return jsonNoStore({ ok: true, data: result.data });
}
