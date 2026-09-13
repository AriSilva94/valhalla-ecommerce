import { readAuthCookies, jsonError, jsonNoStore } from "../../auth/_shared";
import { resolveSession } from "../../../lib/auth-session";
import * as checkoutClient from "../../../lib/checkout-strapi-client";
import { CHECKOUT_ERROR_CODES } from "../../../lib/checkout-contracts";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { accessToken, refreshToken } = readAuthCookies(request);
  const session = await resolveSession(accessToken, refreshToken);
  if (!session.ok) return jsonError(session.error, session.status);

  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return jsonError(CHECKOUT_ERROR_CODES.NOT_FOUND, 404);
  }

  const result = await checkoutClient.getOrder(accessToken!, orderId);
  if (!result.ok) return jsonError(result.error, result.status);
  return jsonNoStore({ ok: true, data: result.data });
}
