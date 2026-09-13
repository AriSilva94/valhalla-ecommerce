import { readAuthCookies, jsonError, jsonNoStore, jsonWithCookies } from "../../auth/_shared";
import { resolveSession } from "../../../lib/auth-session";
import { buildAuthCookieInstructions } from "../../../lib/auth-cookies";
import * as checkoutClient from "../../../lib/checkout-strapi-client";
import { CHECKOUT_ERROR_CODES, type Order } from "../../../lib/checkout-contracts";
import { getProductBySlug } from "../../../lib/strapi";

// Order items are an immutable price/name snapshot — they never carry an
// image URL. Enriching with the product's *current* image here is purely
// cosmetic (order history display), so a lookup failure for any item must
// never fail the whole response — the item just renders without a photo.
async function withItemImages(order: Order): Promise<Order> {
  const uniqueSlugs = [...new Set(order.items.map((item) => item.productSlug))];
  const imageBySlug = new Map<string, string | null>();

  await Promise.all(
    uniqueSlugs.map(async (slug) => {
      try {
        const product = await getProductBySlug(slug);
        imageBySlug.set(slug, product?.mainImage?.url ?? null);
      } catch {
        imageBySlug.set(slug, null);
      }
    })
  );

  return {
    ...order,
    items: order.items.map((item) => ({
      ...item,
      productImageUrl: imageBySlug.get(item.productSlug) ?? null,
    })),
  };
}

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

  const { id: reference } = await params;
  if (!/^[a-f0-9]{6,40}$/i.test(reference)) {
    if (session.data.refreshed && session.data.newTokens) {
      const cookieInstructions = buildAuthCookieInstructions(session.data.newTokens, secure);
      return jsonWithCookies({ ok: false, error: CHECKOUT_ERROR_CODES.NOT_FOUND }, 404, cookieInstructions);
    }
    return jsonError(CHECKOUT_ERROR_CODES.NOT_FOUND, 404);
  }

  const result = await checkoutClient.getOrder(tokenToUse, reference);

  if (session.data.refreshed && session.data.newTokens) {
    const cookieInstructions = buildAuthCookieInstructions(session.data.newTokens, secure);
    if (!result.ok) {
      return jsonWithCookies({ ok: false, error: result.error }, result.status, cookieInstructions);
    }
    return jsonWithCookies({ ok: true, data: await withItemImages(result.data) }, 200, cookieInstructions);
  }

  if (!result.ok) return jsonError(result.error, result.status);
  return jsonNoStore({ ok: true, data: await withItemImages(result.data) });
}
