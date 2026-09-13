import { readAuthCookies, jsonError, jsonNoStore, getClientIp, isOriginAllowed, enforceRateLimit } from "../auth/_shared";
import { resolveSession } from "../../lib/auth-session";
import { getAllowedOrigin } from "../../lib/auth-request";
import * as checkoutClient from "../../lib/checkout-strapi-client";
import { CHECKOUT_ERROR_CODES, type OrderItemInput } from "../../lib/checkout-contracts";

export async function POST(request: Request): Promise<Response> {
  if (!isOriginAllowed(request, getAllowedOrigin())) {
    return jsonError(CHECKOUT_ERROR_CODES.INVALID_ORIGIN, 403);
  }

  const { accessToken, refreshToken } = readAuthCookies(request);
  const session = await resolveSession(accessToken, refreshToken);
  if (!session.ok) return jsonError(session.error, session.status);

  const rateLimitKey = `checkout:${getClientIp(request)}`;
  const rateLimit = enforceRateLimit(rateLimitKey, 10, 5 * 60 * 1000);
  if (!rateLimit.allowed) return jsonError(CHECKOUT_ERROR_CODES.RATE_LIMITED, 429);

  let body: { items?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError(CHECKOUT_ERROR_CODES.VALIDATION_ERROR, 400);
  }

  const rawItems = Array.isArray(body.items) ? body.items : [];
  const items: OrderItemInput[] = [];
  for (const raw of rawItems) {
    if (
      typeof raw !== "object" ||
      raw === null ||
      typeof (raw as Record<string, unknown>).productSlug !== "string" ||
      typeof (raw as Record<string, unknown>).variantSku !== "string" ||
      typeof (raw as Record<string, unknown>).qty !== "number"
    ) {
      return jsonError(CHECKOUT_ERROR_CODES.VALIDATION_ERROR, 400);
    }
    const item = raw as Record<string, unknown>;
    items.push({
      productSlug: item.productSlug as string,
      variantSku: item.variantSku as string,
      qty: item.qty as number,
    });
  }
  if (items.length === 0) return jsonError(CHECKOUT_ERROR_CODES.EMPTY_CART, 400);

  const result = await checkoutClient.createOrder(accessToken!, items);
  if (!result.ok) return jsonError(result.error, result.status);

  return jsonNoStore({ ok: true, data: result.data }, 201);
}
