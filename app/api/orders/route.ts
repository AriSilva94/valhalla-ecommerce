import { readAuthCookies, jsonError, jsonNoStore } from "../auth/_shared";
import { resolveSession } from "../../lib/auth-session";
import * as checkoutClient from "../../lib/checkout-strapi-client";

export async function GET(request: Request): Promise<Response> {
  const { accessToken, refreshToken } = readAuthCookies(request);
  const session = await resolveSession(accessToken, refreshToken);
  if (!session.ok) return jsonError(session.error, session.status);

  const result = await checkoutClient.listOrders(accessToken!);
  if (!result.ok) return jsonError(result.error, result.status);
  return jsonNoStore({ ok: true, data: result.data });
}
