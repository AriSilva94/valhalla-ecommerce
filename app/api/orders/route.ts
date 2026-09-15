import { readAuthCookies, jsonError, jsonNoStore, jsonWithCookies } from "../auth/_shared";
import { resolveSession } from "../../lib/auth-session";
import { buildAuthCookieInstructions } from "../../lib/auth-cookies";
import * as checkoutClient from "../../lib/checkout-strapi-client";

export async function GET(request: Request): Promise<Response> {
  const { accessToken, refreshToken } = readAuthCookies(request);
  const session = await resolveSession(accessToken, refreshToken);
  if (!session.ok) return jsonError(session.error, session.status);

  const secure = process.env.AUTH_COOKIE_SECURE !== "false";
  const tokenToUse =
    session.data.refreshed && session.data.newTokens ? session.data.newTokens.accessToken : accessToken!;

  const requestUrl = new URL(request.url);
  const page = requestUrl.searchParams.get("page");
  const pageSize = requestUrl.searchParams.get("pageSize");
  const result = await checkoutClient.listOrders(tokenToUse, {
    ...(page ? { page: Number(page) } : {}),
    ...(pageSize ? { pageSize: Number(pageSize) } : {}),
  });

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
